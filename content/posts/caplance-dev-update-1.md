+++
title = "Caplance Development Update 1"
description = "It's about damn time"
date = "2019-05-25"
categories = [ "networking", "programming", "post" ]
tags = [
  "go",
  "golang",
  "load balancing",
  "networking",
  "linux",
  "caplance"
]
+++

After countless hours spent reading the GoDocs, googling "gre packets golang", and staring at the term SIGSEV, I've got an update! I've made pretty significant progress on the actual load balancer, implementing most of the base functionality. So far, the load balancer can:

- listen for and ingest whole IP packets
- select the backend for a packet based on a combination of IP and source port
- encapsulate packets in UDP and send them to the appropriate backend
- attach a specified virtual IP

I've also implemented some extremely rudimentary testing and setup, but I'm going to rework those once the project structure solidifies some more.

Here's some detail on the more interesting technical parts of the project so far:

## Listening

I initially listened for packets with a go interface for pcap, a packet capture protocol that allows the user to select an interface and "sniff" its packets. If you've used tcpdump, you've used pcap. With pcap, I could tap into the interface that the virtual IP was using and filter for only the packets destined for the VIP. Then, I could read the packets right off the interface. There were two problems with this approach:

1. I wasn't actually doing listening in a conventional way. If you pull up `ss -4l`, you wouldn't see any entry for Caplance (because I'm not technically listening. I'm creating a TAP device). That's a pretty big problem just because I want Caplance to work well with conventional Unix tools.
2. Closing a pcap device from go is stupid slow. In my tests, closing the device took upwards of 30 seconds, and the device needs to be closed before Caplance can terminate. This is unacceptable, and it was ultimately what did in the pcap approach for me.

Enter [IPConn](https://golang.org/pkg/net/#IPConn). IPConn is a listener for go that listens at the IP level. That means, when you do a read off of it, it reads in from the IP layer down, exactly what I want. Since it's a built-in go listener, it also closes extremely quickly. Whereas before I needed to set up a filter, find the appropriate device, etc., with IPConn, my listening can be reduced to this simple function:

```go
func (b *Balancer) listenWithConn(conn *net.IPConn, pool *sync.Pool) {
	for {
		buf := pool.Get().([]byte)
		n, err := conn.Read(buf)
		if err != nil {
			log.Println("could not read from connection")
			continue
		}
		toSend := rawPacket{buf, n}
		b.packets <- toSend
	}
}
```

To provide a bit of context around this function, `pool` is a pool of buffers that the IPConn can use to store data from reads. `b.packets` is a channel (concurrency-safe queue) of packet for the worker goroutines to read packets off of.

## Packet Forwarding

While I would to use normal routing rules to route incoming packets over GRE tunnels to backends, that won't work here. If we were always forwarding the same IP range of packets to the same backends, we could use iptables, but for this project, we want to use consistent hashing. Because of this, we have to write listening (as seen above) and packet forwarding ourselves.

First, it's important to note that there's no good GRE library for go right now. The only real way to create a GRE tunnel in go is to make calls to the kernel to tell it to construct one. There's no way to have a GRE object, for instance, that you can just write data to in the same way you do with a TCP connection. I may take this up as a future project.

Because of the lack of a library, I would have to write data directly to the wire. My initial idea was to (again) use pcap. My algorithm was as follows:

1. Create GRE tunnel to backend (with netlink)
2. Manually create GRE header for backend
3. For each packet destined for the backend:
    1. Create appropriate GRE header for the packet
    2. Marshal GRE header into a `[]byte`
    3. Append the packet onto the marshalled header
    4. Perform some crazy pcap magic to figure out mac addresses of the next hop on the way to the backend
    5. Write the encapsulated packet to the right physical interface

Ya know, now that I type it all out, that was an awful plan.

After a lot of frustration and reflection, I asked myself the pivotal question, "Why am I so set on GRE in the first place?" The only reason I could come up with was that Google used it, and that's a pretty bad reason. Thinking about it more, I realized I could just use a UDP connection in place of GRE and achieve the same results I wanted.

Now, my algorithm is as follows:

1. Dial a UDP connection to each backend
2. Write each packet to the appropriate backend with the built-in `Write(data []byte)` method

That's a wee bit simpler. It's not as easy to show in a single piece of code as listening, but it wasn't too hard to write.

## Graceful Stop

I implemented graceful stop, which turned out to be way harder than I expected. I'm anticipating writing about it in the future, though, so I'm not going to include details on how it works right now. It's also very likely that I'll change how it's implemented. If you want to see the current iteration of it right now, [you can find the code here](https://github.com/Pwpon500/caplance/blob/4887f8c6230fbe062660c300df0a81f02450f064/balancer/control.go#L80).

# Future Work

Obviously, I'm not done yet. I still need to implement the following:

- Configuration file
- Environment variable configuration
- Client registration
- Client health checks
- Client packet injestion
- Optimization
- More that I don't even know exists yet

I'm crazy excited to get started on all those items, and I can't wait to write about them once I figure them out.


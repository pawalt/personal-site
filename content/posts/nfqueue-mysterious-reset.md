+++
title = "NFQUEUE and the Mysterious RESET"
description = "I thought they disproved spontaneous generation..."
date = "2019-06-27"
categories = [ "network", "programming", "post" ]
tags = [
  "caplance",
  "load balancing",
  "networking",
  "linux",
]
+++

While working on my load balancer, [Caplance](https://github.com/pwpon500/Caplance), I ran into a very strange error when trying to establish a connection between a client and a backend. Before I go to deep, though, let me give a quick intro into how TCP connection establishment works.

### Types of message

When establishing a TCP connection, there are 4 possible packet types you could see:

- SYN (`S` in `tcpdump`) - Always the first message sent. It is the message from the client to the server effectively saying "I would like to connect."
- SYN-ACK (`S.` in `tcpdump`) - The server's reply to a SYN if it wishes to accept the connection.
- ACK (`A` or `.` in `tcpdump`) - The client's reply to a SYN-ACK, fully establishing the TCP connection.
- RESET (`R` in `tcpdump`) - The server's response to a SYN if it wishes to refuse the connection.

In a successful connection, the order will be SYN, SYN-ACK, ACK. In an unsuccessful connection, the order will be SYN, RESET.

### Operating systems and TCP

When a program wants to use TCP, it asks the OS to "bind" to a TCP port. Then, when packets come into that TCP port, the OS hands off the packets to the program. The program can then reply to those packets however it wants (accepting or rejecting the incoming connections).

If a program is not bound to a port and a SYN is sent to that port, the OS immediately replies to the SYN with a RESET.

In the case of Caplance, the load balancer isn't listening on a specific TCP port. Instead, it listens for any and all TCP packets. As a result, no bindings are created by Caplance.

## The Bug

Ok, now on to the fun part. I had finally gotten to the point in Caplance where I could send a request to the load balancer's IP and have a backend respond to the request, or so I thought. For the purposes of this demo, h1 is the load balancer, h2 is the backend, and h3 is the client. 10.0.0.50 is the virtual IP that the load balancer is serving. Let's start up a netcat TCP server on h2 and try to send a request from h3:

``` bash
h2 $ nc -l 10.0.0.50 8080

h3 $ telnet 10.0.0.50 8080
Trying 10.0.0.50...
telnet: Unable to connect to remote host: Connection refused
```

Well, what can you expect really? Things never work on the first try. This time, let's do the exact same thing but use `tcpdump` to see what's happening on h2.

```bash
h2 $ tcpdump -i any host 10.0.0.50 and tcp -n
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on any, link-type LINUX_SLL (Linux cooked), capture size 262144 bytes
20:57:32.941669 IP 10.0.0.3.36040 > 10.0.0.50.8080: Flags [S], seq 252176171, win 29200, options [mss 1460,sackOK,TS val 2262321703 ecr 0,nop,wscale 9], length 0
20:57:32.941701 IP 10.0.0.50.8080 > 10.0.0.3.36040: Flags [S.], seq 492629165, ack 252176172, win 28960, options [mss 1460,sackOK,TS val 4192526147 ecr 2262321703,nop,wscale 9], length 0
```

Here, `tcpdump` is showing us that the backend is seeing 2 packets. One is a SYN from the client to the server, and one is a SYN-ACK from the server to the client. If you remember, these are exactly the messages we expect ... minus an ACK from the client.

At this point, the logical conclusion is that packets are able to flow from client to server, but the ones going server to client aren't making it. Just for sanity, let's see what the `tcpdump` output looks like for the client.

```bash
h3 $ tcpdump -i any host 10.0.0.3 and tcp -n
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on any, link-type LINUX_SLL (Linux cooked), capture size 262144 bytes
21:11:45.055143 IP 10.0.0.3.37388 > 10.0.0.50.8080: Flags [S], seq 3009015791, win 29200, options [mss 1460,sackOK,TS val 2263173829 ecr 0,nop,wscale 9], length 0
21:11:45.059240 IP 10.0.0.50.8080 > 10.0.0.3.37388: Flags [R.], seq 0, ack 3009015792, win 0, length 0
21:11:45.059248 IP 10.0.0.50.8080 > 10.0.0.3.37388: Flags [S.], seq 2629426318, ack 3009015792, win 28960, options [mss 1460,sackOK,TS val 4193378273 ecr 2263173829,nop,wscale 9], length 0
```

... What?

At this point, I'm baffled. Let's recap what's going on here. The server is seeing a SYN and SYN-ACK. However, the client is seeing a SYN, SYN-ACK, and RESET. How is it possible that the client could be sent both a SYN-ACK and a RESET from the same source??

If you're interested in this stuff, I invite you to sit for a minute and think about why this might be happening. This is one of the more interesting bugs I've run into in a while. The presence of a SYN-ACK and RESET concurrently really interested me.

### The bug revealed

Remember when I said that Caplance isn't binding to a specific port? That turns out to be the key to the puzzle here. Let's think about the connection establishment journey:

1. SYN leaves the client
1. SYN hits the load balancer
    1. Because the load balancer isn't actually bound to a TCP port, the OS replies to the client with a RESET
    1. The load balancer forwards the SYN to the backend
1. SYN hits the backend
    1. Backend replies to the client with SYN-ACK
1. Client receives RESET
1. Client receives SYN-ACK

As is typical, the actual bug is pretty simple in hindsight, but it can be hard to find in the moment.

## Enter NFQUEUE

So now we're in a conundrum: we want to stop the OS from seeing packets destined for the VIP, but we also want the OS to give packets destined to the VIP to our program so it can forward then to the appropriate backend. This is where NFQUEUE comes into play.

NFQUEUE is a iptables filter rule that queues up incoming packets onto a queue, waiting to be processed by some program in userspace. Let's see an example rule.

The following rules will drop all tcp and udp packets destined for the IP `10.0.0.50`:

```bash
$ iptables -A INPUT -d 10.0.0.50/32 -p tcp -j DROP
$ iptables -A INPUT -d 10.0.0.50/32 -p udp -j DROP
```

What if instead, we want to put all tcp and udp destined for `10.0.0.50` onto a NFQUEUE with the id 0? We can simply modify our previous rule as follows:

```bash
$ iptables -A INPUT -d 10.0.0.50/32 -p tcp -j NFQUEUE --queue-num 0
$ iptables -A INPUT -d 10.0.0.50/32 -p udp -j NFQUEUE --queue-num 0
```

Now, we have a single source (queue 0) that we can consume all our packets off of! There are bindings to do this in many languages, but I'm using Go for Caplance, so here's a snippet of how this looks in Go.

```go
b.nfq, err = netfilter.NewNFQueue(0, 100, netfilter.NF_DEFAULT_PACKET_SIZE)
if err != nil {
    log.Panicln(err)
}
packetChan := b.nfq.GetPackets()
stopped := false
for !stopped {
    select {
    case packet := <-packetChan:
        b.packets <- packet.Packet.Data()
        packet.SetVerdict(netfilter.NF_DROP)
    case sig := <-b.stopChan:
        b.stopChan <- sig
        stopped = true
    }
}
```

Don't worry if you don't understand the Go specifics of this code. The important thing is that we're creating a NFQUEUE receiver called `b.nfq`. Then, we create a channel called `packetChan` off of which we can consume whatever packets come in to queue 0.

### Running it

Let's make sure this works! If it does, we should see whatever we type into h3 popping up in the TCP server on h2.

```bash
h3 $ telnet 10.0.0.50 8080
Trying 10.0.0.50...
Connected to 10.0.0.50.
Escape character is '^]'.
Is this working?
It is!!!!!
 ^]
telnet> close
Connection closed.

h2 $ nc -l 10.0.0.50 8080
Is this working?
It is!!!!
```

We did it! NFQUEUE was the answer to our problems.

## Conclusion

When I found out about NFQUEUE, I was dumbstruck. It solved so many of my problems - creating a single source from which I could consume packets, stopping the load balancer from replying to the wrong packets, and overall just cleaning up my code. If you've got a project like this, I highly recommend looking at NFQUEUE as a potential option.


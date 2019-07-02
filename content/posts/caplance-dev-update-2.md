+++
title = "Caplance Development Update 2"
description = "Well that was fast"
date = "2019-06-30"
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

I'm back! Over the past few weeks, I've had much more time to work on Caplance than I had in the prior months, so, naturally, a ton of work has gotten done in these few weeks. Specifically, I've implemented the following functionality:

- Backend registration
- The following controls from the backends:
    - PAUSE
    - DEREGISTER
    - RESUME
    - HEALTH
- `caplancectl` to tell a running client process to issue one of those commands
- Graceful stop for backends
- Packet listening on NFQUEUE
- Refactor project structure

If you've been keeping track, you'll notice that this puts us very close to the Caplance MVP! All that's left is config file parsing and some housekeeping.

Here are some of the more technically interesting parts of this revision of Caplance:

## NFQUEUE

If you've got some time and an appetite for some very interesting debugging, I highly recommend taking a look at [my post about NFQUEUE]({{< ref "nfqueue-mysterious-reset.md" >}}). If you don't, here's the TL;DR:

I switched how listening works in Caplance again. Now, I'm using NFQUEUE, an iptables option to hand off packets from an iptables rule to a program in userspace before any packet processing is done.

## Backend Communication

One of the things I wanted to learn from this project was how to write a system for keeping track of state between two hosts. I looked (extensively) into using RPC for this, but it just didn't seem like the right move. RPC is designed to make "remote process calls", but I don't really need that. I need a way to keep track of state. I could've mangled RPC to do this, but I think just writing it myself turned out to be more elegant.

The first step in creating this was creating the interface. I created a simple interface called `Communicator` to write data, read data, and close the underlying connection:

```go
// Communicator is the connection manager for a backend
type Communicator interface {
    ReadLine() (string, error)
    WriteLine(data string) error
    Close() error
}
```

To actually implement this, I created a `TCPCommunicator` struct and filled in the methods.

```go
// TCPCommunicator is an implementation of BackendCommunicator over TCP
type TCPCommunicator struct {
    reader       *bufio.Reader
    writer       *bufio.Writer
    conn         net.Conn
    readTimeout  time.Duration
    writeTimeout time.Duration
}
```

This struct has a reader and writer to get data from the underling connection. It also has a readTimeout and writeTimeout. While the writeTimeout is fairly mundane, the readTimeout turns out to be surprisingly useful.

In order to deregister a backend after a certain period of inactivity, I can just use the `SetReadDeadline(t time.Time) error` function with the `readTimeout`. Then, if the read errors out, and the error is a timeout, I know that the inactivity window has closed. Baking this logic into the TCPCommunicator, I now have a powerful tool that I can use on both the backend and load balancer side!

I also implemented the following commands that the client can send to the server:

- PAUSE - client requesting to stay registered but not have packets forwarded to it
- DEREGISTER - client requesting to deregister
- RESUME - client requesting to have packets forwarded after a PAUSE
- HEALTH - message sent every few seconds to stop server from deregistering the client due to inactivity

The way these are implemented isn't particularly interesting. I'm just using a bufio reader to read data off the connection and parsing it with simple string tools.

## Caplancectl

This isn't the most complex part of Caplance by any means, but I was blown away by how simple the `net/rpc` package made writing caplancectl, so I wanted to share.

Caplancectl connects to Caplance using a unix socket that Caplance creates at `/var/run/caplance.sock`. Caplance listens just as it would with a TCP listener:

```go
c.unixSock, err = net.Listen("unix", SOCKADDR)
```

Now that I've got that socket, I can hand it off to the `rpc` package, and the rest of the networking is done for me!

```go
rpc.Register(c) // registering the client to receive requests over rpc
rpc.HandleHTTP()
http.Serve(c.unixSock, nil)
```

Now that I've got the RPC listening, all I have to do is define some methods that the RPC can execute. The RPC registers any methods from the registered object that take two arguments for which the latter is a pointer and returns an error. More formally, the methods must have this signature:

```go
func (t *T) MethodName(argType T1, replyType *T2) error
```

For example, my pause function looks like this:

```go
// Pause command from caplancectl
func (c *Client) Pause(req *string, reply *string) error {
    err := c.pause()
    if err == nil {
        *reply = "Pause request sent"
    } else {
        *reply = "Pause request encountered an error: " + err.Error()
    }
    return nil
}
```

That's all that needs to be done from the server side! If you think that's easy, the client side is even easier.

On the client side, I can just use the RPC package to dial and then call whatever method I want. For example, if I wanted to issue a pause request, I would only need this code:

```go
client, err := rpc.DialHTTP("unix", SOCKADDR)
if err != nil {
    log.Fatal(err)
}

var reply string
err = client.Call("Client.Pause", "", &reply)
if err != nil {
    log.Fatal(err)
}
fmt.Println(reply)
```

Pretty cool, right?

# Future Work

I'm pretty close to MVP. To get there, I have to implement the following:

- Config file parsing
- Non-stdout logging

I've got some more features I'd like to implement, but we're gonna focus on MVP for now. These shouldn't be too hard to get implemented, so keep you eyes peeled for update 3!


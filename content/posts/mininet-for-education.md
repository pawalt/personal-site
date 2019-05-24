+++
title = "Mininet for Education"
description = "Providing education access to all"
date = "2019-04-29"
categories = [ "programming", "networking", "post" ]
tags = [
  "mininet",
  "linux",
  "education",
  "networking"
]
+++

For about 2 years, I built and led the [NEAT Rack Project](http://rva-ix.net/the-neat-rack-program/), a program meant to teach high school and college aged students network engineering. In this program, we covered things as basic as introduction to Linux and as advanced as firewalling or dynamic routing with BGP. This program was well-run, well-written, and it overall did a solid job of giving students an introduction to technology infrastructure. There was just one problem with it - hardware.

This program requires that the students have access to a rack with a managed switch and at least one server capable of virtualization. First, these resources are often difficult for schools to procure. Then, even if the school can procure them, only a single student or group of students can work on the labs at a time. Furthermore, working on labs at home isn't even a possibility since you can't take a whole rack home.

Mininet aims to solve these problems.

## What is Mininet?

Mininet is a network simulation tool for Linux. The goal of it is to create a "realistic virtual network" with minimal overhead. Since it aims for minimal overhead, it shares both filesystem space and PID space with the host it operates on. Both of these can be avoided, however, with the private directories host option in Mininet.

One cool thing about Mininet is how lightweight it is. Since it does basically no isolation other than creating some virtual kernels, it spins up and down in seconds, using minimal memory. This means it can run on a device as weak as a Raspberry Pi!

## The Mininet API

Another amazing part of Mininet is its Python API. This API lets you programmatically create new networks, interact with them, and destroy them. Take the following simple example:

``` python
#!/usr/bin/env python2
""" This script provides a basic switch topo."""

from functools import partial
from mininet.topo import SingleSwitchTopo
from mininet.net import Mininet
from mininet.cli import CLI
from mininet.node import Host
from mininet.log import setLogLevel


def simple_test():
    "Create and test a simple network"
    topo = SingleSwitchTopo(k=5)
    private_dirs = ['/run', ('/var/run', '/tmp/%(name)s/var/run'), '/var/mn']
    host = partial(Host, privateDirs=private_dirs)
    net = Mininet(topo=topo, host=host)
    net.start()
    CLI(net)
    net.stop()


if __name__ == '__main__':
    # Tell mininet to print useful information
    setLogLevel('info')
    simple_test()
```

In these few lines of code, I have a file that will automatically create a network with 5 hosts on it where each host has PID separation. Now, instead of having to manually specify all these options, the user can just run "sudo ./setup.py", and they're consoled in.

The possibilities only begin here. Things get even crazier with [custom topologies](http://mininet.org/walkthrough/#custom-topologies).

## Teaching Example

I could go on and on about Mininet, but the power of it becomes most evident when you actually see how it can be used. [Here](https://github.com/pwpon500/teaching), I'm working on building up some labs based around Mininet for my friends to learn network engineering with. Feel free to try the labs and contribute your own!


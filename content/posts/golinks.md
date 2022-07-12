+++
title = "Golinks at home"
description = "I got thoroughly nerdsniped by this"
date = "2022-07-12"
categories = [ "networking", "programming", "post" ]
tags = [
  "go",
  "golang",
  "tailscale",
  "networking",
  "openwrt",
  "fly"
]
+++

I recently moved into an apartment which means I get to have something I've missed for the last four years: a homelab! After hearing about the homelab, my roommate asked me "Would it be possible to get network-wide golinks?" After some thinking and looking at a [similar project I worked on](https://github.com/pawalt/shortname), I decided to build them!

## How Golinks Work

The goal of a golink is to allow the user to input a short URL like `go/gh/` and be redirected to a longer url such as `https://github.com/`. These should also be path-preserving, so `go/gh/pawalt` should go to `https://github.com/pawalt`.

This is primarily achieved by reconfiguring DNS with a special mapping for `go` and serving a redirect whenever we see one of our redirect paths.

### DNS lookup

When the browser (or any HTTP client) looks up a URL like `go/gh`, it first has to know what IP to send the request to. To do this, it looks up the host of the request (in this case `go`) using a DNS server. We need to get some access to our DNS server so that we can set the `go` entry to our IP.

Additionally, if we want to serve redirects on hosts other than `go` (`gh -> github.com` for example), we'll need to update DNS with each host that we want to redirect from.

### Serving the redirect

Now that a request for `go/` has made it to our application, we need a way to serve a redirect to our destination URL. In order to serve the redirect, we'll run a web server that accepts request on all routes. When it gets a request, it looks up the host and path in its list of redirects. If it finds a matching redirect rule, it'll serve an HTTP redirect (usually 302) to the destination URL.

The combination of DNS + HTTP redirect means requests for any source URL will get automatically redirected to their destination URLs.

### Editing the redirect list

With the mechanics in place, we need a way to edit the mappings from source to destination URL. For these, we can simply run a web server that retrieves a list of the current mappings and displays them, allowing the user to edit the list. When the user saves a new set of mappings, it must be stored ✨ somewhere ✨, and DNS must be reconfigured for any new hosts that are added.

With each component, we get a workflow that looks like:
1. User adds a new redirect in web editor
2. New redirect is saved, and DNS is reconfigured with any new hosts
3. User can make a request and be redirected
	1. DNS points the host to the right IP
	2. The webserver serves a redirect to the desired URL

## Implementation

To implement this, I've got two devices I'm talking to - my router for the DNS and the computer running the redirect webserver. In this case, I'm using a [fly.io](https://fly.io/) VM to host the redirect webserver. Each of these devices might be on completely separate networks with no way to talk to each other.

{{< figure src="/img/golinks_1.png" caption="Network diagram without connections" >}}

### Tailscale

To connect my devices, I'm using [Tailscale](https://tailscale.com/). You can think of Tailscale as a zero-config peer-to-peer VPN solution, although it's really more than that (words on this later). Tailscale gives each of my devices an IP in the 100.x.y.z range and connects them using a WireGuard tunnel. This means that even on different networks, my laptop can directly access both devices on consistent IPs.

{{< figure src="/img/golinks_2.png" caption="Network diagram with Tailscale-provisioned 100.x.y.z IPs" >}}

With a little extra work, we can even get this connected to the entire home network, meaning non-Tailscale devices can still use golinks. To do this, I designate my router as a [subnet router](https://tailscale.com/kb/1019/subnets/), meaning that Tailscale knows to route traffic for my home network through it. In this case, my home network is `172.27.0.0/16`, so any requests for that range will go through my router, `100.2.3.4`.

{{< figure src="/img/golinks_2.5.png" caption="Home network connected to tailnet via router" >}}

### Host file

First, we need to get DNS overriding working - requests for URLs like `go/` should be sent to our VM in Fly. We can achieve this by adding a hosts file to our router's DNS settings. I'm using [OpenWRT](https://openwrt.org/start) on my router which uses [Dnsmasq](https://thekelleys.org.uk/dnsmasq/doc.html) for DHCP and DNS. Just as `/etc/hosts` lets us define custom `host -> IP` mappings on our computers, we can add a hosts file to Dnsmasq for our own custom mappings.

The hosts file will use the Fly VM's tailscale IP as the IP to connect to, and it'll store the mappings in comments. This information is our entire state which means we can just use this file instead of any databases. Here's how a table of redirects would be formatted down in our hosts file:

| **Source** | **Destination**                                    |
|------------|---------------------------------------------|
| gh         | https://github.com                          |
| gh/pl      | https://github.com/pennlabs                 |
| gh/pw      | https://github.com/pawalt                   |
| go/gh      | https://github.com                          |
| go/mon     | https://www.youtube.com/watch?v=b2F-DItXtZs |
```
root@OpenWrt:~# cat /etc/hosts.d/golinks.hosts
# this hosts file property of me!!! dont touch


100.79.24.134 gh # gh -> https://github.com
100.79.24.134 gh # gh/pl -> https://github.com/pennlabs
100.79.24.134 gh # gh/pw -> https://github.com/pawalt
100.79.24.134 go # go/gh -> https://github.com
100.79.24.134 go # go/mon -> https://www.youtube.com/watch?v=b2F-DItXtZs
```

### Serving the redirect

Serving the redirect is fairly straightforward - when a user makes a web request to the Fly VM, it will look up the link in its redirect map and serve a redirect (302 Found) to the redirect destination. If it can't find a matching redirect, it'll serve a 404.

### Editing the redirect list

To view and edit the redirects, the same webserver that does the redirecting serves a UI on `go/_/hosts`. I use a weird path (`/_/hosts`) so there's a low chance of collision with any URL I'd actually want to go to via a golink.

![UI to edit list of redirects](/img/golinks_3.png)
When the user hits `Submit`, the list of redirects is POSTed to `/_/hosts`. The list is then persisted in the router's golinks host file (mine is `/etc/hosts.d/golinks.hosts`).

#### Mapping persistence

As previously mentioned, the information on the mappings is stored entirely in the router's hosts file so as to not have any local state to deal with. In an ideal world, I could just use SFTP to read and write the mapping data in the hosts file, but this normally requires me to mint an ssh key and distribute it to both Fly and my router.

Luckily, [Tailscale SSH](https://tailscale.com/blog/tailscale-ssh/) obviates the need for any of that! By running Tailscale SSH on my router[^ssh], I can SSH into it via any device I'm logged into. This means that my Fly VM can SSH into the router without providing any credentials - simply by being on the tailnet, it has the authorization to SSH[^auth].

[^ssh]: Unfortunately, the [tailscale OpenWRT package](https://openwrt.org/packages/pkgdata/tailscale) is pretty out-of-date as of this post. To get Tailscale SSH, I SFTPed the [Tailscale ARM statically-linked binary](https://pkgs.tailscale.com/stable/#static) to my router.

[^auth]: I'm currently on a single-user plan, so my rules are pretty relaxed. Once Tailscale gets [better account sharing](https://tailscale.com/kb/1064/invite-team-members/#how-can-i-invite-someone-if-i-signed-up-with-a-gmail-address-or-a-github-personal-account), I'll do some ACL work and lock down SSH access to only my personal devices.

**Reading**

To read in a mapping, the application will SFTP into the router and read the hosts file (default `/etc/hosts.d/golinks.hosts`). It'll then parse out the comments and update its stored mapping to reflect the mappings in the comments.

This list is refreshed every 5 minutes in case of a out-of-band edit to the file.

**Writing**

Before writing out the hosts file, I have to answer a question: what IP should be advertised to the clients i.e. what IP does the Fly VM have that is routable from my laptop? It's the Tailscale IP! To get the Tailscale IP, I dial a UDP connection to `100.100.100.100`, one of Tailscale's managed IPs. Since it's Tailscale-managed, the source IP on this connection is my Tailscale IP.

To render out the hosts file, I have a very simple template:

```
# this hosts file property of me!!! dont touch  
  
{{ range .lines }}  
{{ .ip }} {{ .host }} # {{ .comment }}  
{{- end }}
```

I render this template and SFTP it over to the router to save the new configuration, but there's one last trick. Dnsmasq won't immediately see the new host file, so it might be a few minutes before I can use my link. However, if Dnsmasq receives a `SIGHUP`, it will reload all its config - including the hosts files. To send the `SIGHUP`, I use a quick command: `kill -HUP $(ps | grep dnsmasq | grep -v grep | cut -d " " -f1)`. There's definitely a better way to do this with `syscall.Kill`, but that's a task for later.

Now that we have persistence, our end to end process looks like:
1. User adds a new redirect at `go/_/hosts`
2. New redirect is saved via sftp to `/etc/hosts.d/golinks.hosts`, reconfiguring Dnsmasq
3. User can make a request and be redirected
	1. DNS points the host to the Fly VM
	2. The webserver serves a redirect to the desired URL

<video style="max-width: 100%;" controls>
  <source src="/img/golinks_demo.mp4" type="video/mp4">
Your browser does not support the video tag.
</video>

## Conclusion

In a small bit of code, we've managed to get network-wide golinks and keep them on the go! I've got Tailscale installed on all my devices, so this solution works wherever I am on whatever device I'm using. This new SSH feature has changed the way I see the product - from a VPN solution to a network mesh with trust built in. I hope to see more features like this in the future!

If you want to check out any of the code for this project, head over to [my homelab repo](https://github.com/pawalt/homelab/tree/main/golinks). Just be warned: the code is definitely homelab-quality.


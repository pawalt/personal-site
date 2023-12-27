+++
title = "Nix"
description = "it's actually pretty nice"
date = "2023-12-23"
tags = [
  "nix",
]
+++

[Nix](https://nixos.org/) is a tool for building reproducible environments. It excels in situations where it can have a full view of the world - where every package and piece of configuration is managed by Nix.

One benefit in practice is that it's a really good package manager. [Nixpkgs](https://github.com/NixOS/nixpkgs) has a ton of packages, and it remains relatively stable even if you follow its "unstable" branch. Smarter people than me probably know why this is, but I'm guessing that the "complete view of the world" allows Nix to make much stronger guarantees about what will work and what won't.

It's also great at managing user-level configuration. [Home manager](https://github.com/nix-community/home-manager) has friendly configuration syntax into a ton of commonly-used programs. Using home manager was my first "wtf" moment with Nix. I've been trying to solve the reproducible home problem for _so long_, and Nix just fixed all my problems.

If you're looking to try out Nix, install it and migrate your home bit-by-bit to home manager! You'll be shocked at how easy it is to set up. If you want to get a little deeper, this [book on NixOS and flakes](https://nixos-and-flakes.thiscute.world/) is an amazing resource.
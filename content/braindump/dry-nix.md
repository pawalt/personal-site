+++
title = "Reusing Nix config across modules"
description = "i might be doing this wrong, but it feels nice"
date = "2024-01-20"
tags = [
  "nix",
]
+++

Recently, I wanted to share my [Syncthing](https://syncthing.net/) config across multiple NixOS hosts, and I couldn't find any good information on it online. I hope this helps someone. I have the following config that's parameterized only by the username of the syncthing user - everything else stays the same:

```nix
services.syncthing = {
  enable = true;
  user = user;
  configDir = "/home/${user}/.config/syncthing";
  dataDir = "/home/${user}/.config/syncthing/db";

  overrideDevices = true;
  overrideFolders = true;

  settings = {
    devices = {
      # map from device name to ID
    };

    folders = {
      # generic sync folder
      "cccjw-5fcyz" = {
        path = "/home/${user}/sync";
        devices = [
          # list of device names to share with
        ];
      };
    };
  };
};
```

To modularize this, I created a [Nix function](https://nixos.org/guides/nix-pills/functions-and-imports) with the `user` parameter:

```nix
# ./custom/syncthing.nix
{ user }: {
  # same config from above
  ...
}
```

Then, in my individual NixOS configuration files, I can just import it in my imports line and pass in the right param:

```nix
# ./systems/asahi/default.nix
{ config, pkgs, ... }:

{
  imports = [
    ./asahi-hardwarecfg.nix
    ( import ../../custom/syncthing.nix { user = "peyton"; } )
  ];
...
```

And voilà! I've now DRYed up my configuration files. Here's the [config for the curious](https://github.com/pawalt/setup/blob/334fa8d20d15716bc72fc8e66bd37049b217e0cf/custom/syncthing.nix#L1).

+++
title = "Getting open ports on macOS"
description = "why has god cursed me into using BSD netstat"
date = "2023-12-23"
tags = []
+++

I can never remember how to do this thing. I grew up on [ss](https://man7.org/linux/man-pages/man8/ss.8.html). So for posterity:

```nix
programs.zsh.shellAliases = {
  ss = "sudo lsof -PiTCP -sTCP:LISTEN";
};
```
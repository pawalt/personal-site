+++
title = "NixOS on the desktop is a pain"
description = "the truth big nix doesn't want you to know"
date = "2023-12-24"
tags = [
  "nix",
  "asahi",
]
+++

Let me preface by saying, [NixOS](https://nixos.org/) running on [Asahi](https://asahilinux.org/) is the best Linux experience I've ever had. Every time I've run a Linux distro, I always end up hand-jamming config everywhere and forgetting about it. Over time this config builds up, and after ~1 year, a full wipe is in order. NixOS has basically solved this problem for me - all my configuration is versioned as code, so skew is impossible.

But this experience is not for the faint of heart.

When the package (and version) you need is inside of `nixpkgs`, you're living the good life. You can just add the package name to your package list, hit a `switch`, and start using the package.

When you need an older version of a package, you end up trolling through git history and [locking nixpkgs](https://github.com/pawalt/personal-site/blob/ef42d120310b054d85ace54f80d07a3fcfc9226a/flake.nix#L4) to the revision containing the version you want. If you want a newer version, you might have to update the derivation yourself and PR it in!

You can avoid some of these headaches by [writing an overlay](https://github.com/pawalt/setup/blob/c46fedbdbbd71cfcad6fac0a66661015a2916277/overlays/ollama.nix#L14), but depending on how cleanly the nixpkgs derivation is written, this can range from "wow that was easy" to "why have I spent 10 hours on this".

And in the apocalyptic case where you can't get a derivation written, you might need to [build an FHS environment](https://nixos.org/manual/nixpkgs/stable/#sec-fhs-environments). But even if you do this, programs outside the FHS environment can't use the FHS tooling. This leaves you either putting everything inside this FHS environment or gitting gud at writing derivations.

I'll keep using NixOS, but boy do I miss the days of `curl https://cooltool.com/install.sh | sh`.

+++
title = "Spacemacs-pilled"
description = "more of a way of life"
date = "2023-12-23"
tags = [
    "",
]
+++

I don't really care if people use [Vim](https://neovim.io/), even if I love it. I care a bit more about if people use "vim motions". In my (extremely dogmatic) opinion, vim motions are the only good way to move around code. They make it so easy to move and manipulate text without [moving your hands too much](https://my.clevelandclinic.org/health/diseases/17424-repetitive-strain-injury).

I don't use [Spacemacs](https://www.spacemacs.org/), but I feel the same way about it. The way it uses Vim motions to create easy-to-use chords feels _so_ intuitive to me. I've taken the Spacemacs vibe and created my own set of keybindings in the same spirit that work for me.

I use `<Space>` as my leader with all my actions hanging off of it. Some examples:

- `<Space>{h,j,k,l}` - move directionally in a pane of split windows
- `<Space>f` - symbol search over the project
- `<Space><Space>` - open a pane with all my recently-edited files

I'll add more in the future, but for now, you can see some examples in [my VSCode config](https://github.com/pawalt/setup/blob/afb377090092f943c71a3f386f4c199b7525185f/homes/common.nix#L181).
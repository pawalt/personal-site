+++
title = "My Neovim Go Setup"
description = "Async all the things"
date = "2019-06-01"
categories = [ "programming", "post" ]
tags = [
  "go",
  "golang",
  "vim",
  "neovim",
  "linux",
]
+++

Recently, I moved from writing my Go in VSCode to writing it in Neovim. I did this for two main reasons:

1. Ubiquity

    I use Neovim for writing pretty much all my other code (except Java), so it was weird to use VSCode for this one purpose.

2. Terminal Integration

    I *hate* the VS Code terminal. It doesn't have the character support I want, and it overrides a bunch of keys (for example, Ctrl+f for fish autocomplete). I'm also in the terminal already when I'm doing Go development, so being able to just type `vim` and instantly be in my editor is a blessing.

Before I start, it's important to note that I'm currently doing all this on Ubuntu 18.04 with Go 1.12, provided via the `longsleep/golang-backports` ppa. For more info on how to install Go, [visit the wiki](https://github.com/golang/go/wiki/Ubuntu)

## Basics

The first bit of configuration is my Go tab settings. These are standard for Go, and even if you don't set them, `gofmt` will enforce them anyway.

```vim
au FileType go set noexpandtab
au FileType go set shiftwidth=4
au FileType go set softtabstop=4
au FileType go set tabstop=4
```

I'm using [Vundle](https://github.com/VundleVim/Vundle.vim) for my package management. Frankly, I should be using vim-plug, but I haven't taken the 5 minutes to move over. Vundle does the job just fine.

The first important package to have is [vim-go](https://github.com/fatih/vim-go). This plugin is absolutely fantastic, providing pretty much all the base go features you need. In my configuration for this plugin, I turn on syntax highlighting for basically everything. I also like `goimports` over `gofmt` because it sorts my imports, so I use that as the default formatter. Finally, I turn on highlighting of the variable my cursor is on, and I enable type hints in airline.

```vim
" use goimports not gofmt to format
let g:go_fmt_command = "goimports"
" syntax highlight all the things
let g:go_highlight_build_constraints = 1
let g:go_highlight_extra_types = 1
let g:go_highlight_fields = 1
let g:go_highlight_functions = 1
let g:go_highlight_methods = 1
let g:go_highlight_operators = 1
let g:go_highlight_structs = 1
let g:go_highlight_types = 1
" highlight variables across file
let g:go_auto_sameids = 1
" vim-go get type info in airline
let g:go_auto_type_info = 1
```

Once this is all set, and the plugin is installed, run `:GoInstallBinaries` to get the latest version of all required Go binaries.

## File Explorer

One of the main reasons I switched from Neovim to VS Code for Go development in the first place was the presence of a persistent file browser. I had used NERDTree before, but the fact that it didn't persist through tabs made pretty useless for me. However, recently, I found out about `:NERDTreeMirror`, and it took NERDTree from a nice idea to a killer plugin for me.

`:NERDTreeMirror` does exactly what it sounds like. It starts the NERDTree file browser in the current tab, mirroring the state of the other already-open trees. This allows NERDTree to effectively act like a persistent file browser. The only problem is that this command isn't automatically invoked when a new tab is opened, breaking the illusion of a persistent file browser. To fix this, I wrote my own new tab function that checks if NERDTree is already open, and if it is, `:NERDTreeMirror` is called after the new tab is created. I map this to `<leader>t`, which in my case, is `\t`.

```vim
function! IsNerdTreeEnabled()
  return exists('t:NERDTreeBufName') && bufwinnr(t:NERDTreeBufName) != -1
endfunction
function! TreeTab()
  if IsNerdTreeEnabled()
    execute 'tabe'
    execute 'NERDTreeMirror'
  else
    execute 'tabe'
  endif
endfu
nnoremap <leader>t :call TreeTab()<CR>
```

My other config settings, in order

1. Automatically open NERDTree if no arguments are passed into `vim`
2. Open NERDTree to the current file when `\v` is typed
3. Close NERDTree if it is the only window left

```vim
" auto-open if no args are set
autocmd VimEnter * if !argc() | NERDTree | endif
" open on \v
nnoremap <silent> <Leader>v :NERDTreeFind<CR>
" close if only window left
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTree") && b:NERDTree.isTabTree()) | q | endif
```

## Linting

I use [Ale](https://github.com/w0rp/ale) for linting. It's very fast, and most importantly, it's dumb easy to set up. I've struggled for hours with Neomake only to get it half-working, but Ale worked out of the box. Just make sure you have [golint](https://github.com/golang/lint) installed, and you're good to go.

I also manually configure the error and warning characters and disable the location list for errors. It's more annoying for me than it is helpful.

```vim
" Error and warning signs.
let g:ale_sign_error = '⤫'
let g:ale_sign_warning = '⚠'
let g:ale_set_loclist = 0
```

## Autocomplete

Autocomplete is notoriously hard to set up in Vim/Neovim, and unfortunately, I don't have silver bullet to fix that. I'm using [deoplete](https://github.com/Shougo/deoplete.nvim) and [deoplete-go](https://github.com/deoplete-plugins/deoplete-go) for better Go support. To use the latter, make sure you have [gocode](https://github.com/mdempsky/gocode) installed. I'm still having some problems with errors on startup, but the solution is very good once `gocode` has a chance to start up.

My config options, in order

1. start deoplete at startup
2. allow me to cycle through autocomplete options with the tab key
3. set a order of preference for go autocomplete suggestions

```vim
" deoplete settings
let g:deoplete#enable_at_startup = 1
inoremap <expr><TAB>  pumvisible() ? "\<C-n>" : "\<TAB>"
let g:deoplete#sources#go#sort_class = ['package', 'func', 'type', 'var', 'const']
```

A few tips for setup:

- Make sure the python and python3 Neovim providers are installed. They can be installed with the following commands:

    ```
    $ pip install neovim
    $ pip3 install neovim
    ```

- Make sure all necessary Go binaries are installed. Ensure this with the `:GoInstallBinaries` command in Neovim.
- Add a make instruction in Vundle for `deoplete-go` so that it gets made properly.

    ```
    Plugin 'zchee/deoplete-go', { 'do': 'make'}
    ```

## Misc

Some other plugins I use are:

- [auto-pairs](https://github.com/jiangmiao/auto-pairs) for automatically closing parentheses and brackets
- [vim-airline](https://github.com/vim-airline/vim-airline) for a fantastic statusline
- [vim-devicons](https://github.com/ryanoasis/vim-devicons) to add type icons to NERDTree
- [ctrlp.vim](https://github.com/ctrlpvim/ctrlp.vim) for fast fuzzy search


## Conclusion

With these plugins, I can now use Neovim without losing any of the functionality I got in VS Code! If you're interested, [here's my vimrc](https://github.com/Pwpon500/user-sync/blob/master/vimrc). Happy coding!

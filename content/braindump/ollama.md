+++
title = "Ollama"
description = "oh llama my llama"
date = "2023-12-23"
tags = [
  "ollama",
  "llm",
]
+++

[Ollama](https://ollama.ai/) is a tool for running LLMs locally, inspired by the DevX of Docker. It has a [model hub](https://ollama.ai/library) with the big-name models. You can run models very simply:

```bash
$ ollama serve &
$ ollama run llama2:latest
>>> say whatever you want to say to llama
```

The real magic, though, is in how easy it is to define new model types with different system prompts and parameters:

```bash
$ cat Modelfile
FROM llama2:latest

TEMPERATURE 1
SYSTEM """You are an assistant who will write Peyton's blog posts for him"""
$ ollama create peytonhelper -f Modelfile
$ ollama run peytonhelper
>>> say something to my helper
```

In the past, I've used [ctransformers](https://github.com/marella/ctransformers) for building stuff like this, but it's a bit too low-level. I don't care to learn the proper prompting setup for all these models.

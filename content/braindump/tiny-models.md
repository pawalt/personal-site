+++
title = "Why are your models so big?"
description = "feels like we're giving sam altman free money"
date = "2023-12-26"
tags = [
  "llm",
]
+++

I don't understand why today's LLMs are so large. Some of the smallest models getting coverage [sit at 2.7B parameters](https://huggingface.co/microsoft/phi-2), but even this seems pretty big to me.

If you need generalizability, I totally get it. Things like chat applications require a high level of semantic awareness, and the model has to respond in a manner that's convincing enough to its users. In cases where you want the LLM to produce something human-like, it makes sense that the brains would need to be a little juiced up. 

That said, LLMs are a [whole lot more](https://pawa.lt/posts/2023/08/chatting-with-my-recipes/) than just bots we can chat with. There are some domains that have a tightly-scoped set of inputs and require the model to always respond in a similar way. Something like SQL autocomplete is a good example - completing a single SQL query requires a very small context window, and it requires no generalized knowledge of the English language.  Structured extraction is similar: you don't need 2.7B parameters to go from `remind me at 7pm to walk the dog` to `{ "time": "7pm", "reminder": "walk the dog" }`.

I say all this because [inference is expensive](https://www.forbes.com/sites/craigsmith/2023/09/08/what-large-models-cost-you--there-is-no-free-ai-lunch/). Not only is it expensive in terms of raw compute - maintaining the infrastructure required to run models also gets pretty complicated. You either end up shelling out money for in-house talent or paying some provider to do the inference for you. In either case, you're paying big money every time a user types `remind me to eat a sandwich`.

I think the future will be full of much smaller models trained to do specific tasks. Some tooling to build these [already exists](https://github.com/karpathy/llama2.c), and you can even [run them in the browser](https://github.com/xenova/transformers.js). This mode of deployment is inspiring to me, and I'm optimistic about a future where [15M params is all you need](https://ggerganov.com/llama2.c/).

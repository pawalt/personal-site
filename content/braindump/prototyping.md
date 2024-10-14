+++
title = "Prototyping"
description = "the only tool in my toolbelt"
date = "2024-10-13"
tags = [
  "work",
]
+++

I do basically all of my interesting work through prototypes. In particular, when trying to make a complex change or build out a new system, I start by building out a shit-quality MVP that simply proves the thing I want to do is possible. The code that I write in this process will never see the light of day, but it's the foundation for the rest of my work.

This style of work is foreign in a lot of the industry where design docs are the primary planning vehicle. Ideally, design docs let you gather feedback and de-risk the execution of an idea before you start writing code. This is not my experience. In particular, when executing refactors, the devil is in the details - small edges in how an API is used can change large parts of its implementation. With design docs, it's very difficult to foresee these edges; a working prototype can teach you much more.

This isn't to say that design docs aren't valuable! After building my prototype, I'll reflect on it and write a design doc so that others are aware of my plans and can give any guiding feedback. I do find, though, that having a working prototype tends to end a lot of debate. We can get lost in the "is this possible" weeds; the point of a prototype is to remove this ambiguity.

After making my low-quality prototype and getting light consensus, I PR in my prototype bit-by-bit. In this pass, I'll write nice docs, write tests, and smooth out the hairy edges of my prototype. At this point, I'm effectively doing a rewrite of my previous implementation, so I get to make all the decisions I wish I had made in the first place! I think this results in higher-quality code than writing it cold off a design doc.

This approach is not reasonable at all scales. At some point, it's infeasible to write a prototype, and you're better off designing with trusted co-authors. This is especially true in larger orgs with cross-functional dependencies. That said, I think you can push prototypes far further than people expect with mocking and getting your hands dirty in others' codebases.

This also relies on a particular skill: being able to write bad code very quickly. The core element of execution is the ability to write a prototype quickly enough where you're not slowing down your total velocity. Luckily, I'm great at writing bad code.
+++
title = "Teaching is DAG-building"
description = "and i'm a professional DAG builder"
date = "2024-01-20"
tags = [
  "teaching",
]
+++

In order to understand a given concept, there are a set of "dependent concepts" that are required. Learning multiplication requires an understanding of addition. Learning how to cook a steak requires an understanding of temperature control. Learning Kubernetes requires an understanding of containers.

![kubernetes learning DAG](/img/kube_horizontal.svg)

In my head, I model these relationships as a [DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph). Each node is a concept, and concepts have arrows to the other concepts that depend on them. In order to fully understand one node, you must first explore all the nodes that point to it. You have to bottom out the recursion at some point by taking some facts as axiomatic, but IMO, the further you can go down the better.

As a teacher, your job is to make this DAG exist in the heads of your students. Doing this requires an understanding of two things: how you've built your DAG and the current state of your students' DAGs. These are both deceptively difficult things to understand.

The obvious one comes first: it's impossible to know what your students' level of understanding is. The best you can do is try to guess based on past experience and filter admits to your class based on some criteria. But no matter what you do, different students will come in at different levels of understanding, and students will have gaps in their knowledge you never predicted.

The harder part for me, though, is grokking how my own understanding is built. When you're deep in a subject, you've developed an intuitive understanding so deep that you don't even realize it's there. When teaching Kubernetes, you preach the wonders of its networking model only to realize its value is lost on kids who've never dealt with HA systems. It's not that you expected them to understand high availability - it's just that you forgot it was an integral part of your thought process.

![kubernetes learning DAG with hidden horizontal availability](/img/kube_hidden_horizontal.svg)

It's for all these reasons that I think that **most professors are very bad teachers**. High-level research staff are so far away from undergrads that they can't begin to empathize with their mindset. And they certainly can't introspect enough to fully understand how their DAG is built.

Hopefully in the future we'll see more [classes taught by students](https://www.cis.upenn.edu/~cis19x/), [TAs that are undergrads](https://www.seas.upenn.edu/~cis120/24sp/staff/), and tenure structures that reward the [truly exceptional instructors](https://www.cis.upenn.edu/~swapneel/).


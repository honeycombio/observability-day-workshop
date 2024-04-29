# what is this directory

Don't use this.

## if you are me

I'm deploying this app (the nodejs version) to my sandbox EKS cluster.

First, push the images to dockerhub

Put the multiplatform stuff in: `git cherry-pick multiplatform` (revert it later)

`WORKSHOP_VERSION=prod docker compose build --push`

I might have to change the version to prod-2 or something. Or maybe it's enough to delete the pods... they're supposed to pull every time but it can't be counted on.

So change the version in k8s.yaml... 

Then, apply the k8s.yaml file

`k apply -f k8s.yaml`

see jessitron/infra/otel-demo-help/o11yday-ingress.yaml for the ingress.

this is not a rigorous deployment (it's super flaky really) but I wanted it to be out there so I can show people.

[https://o11yday.jessitron.honeydemo.io]()

This one depends on a honeycomb API key secret that I threw into my cluster, and it reports to o11y-xp-workshop team, prod env.
    
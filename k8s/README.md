# what is this directory

Don't use this.

I'm deploying this app (the nodejs version) to my sandbox EKS cluster.

`k apply -f k8s.yaml`

see jessitron/infra/otel-demo-help/o11yday-ingress.yaml for the ingress.

this is not a rigorous deployment (it's super flaky really) but I wanted it to be out there so I can show people.

[https://o11yday.jessitron.honeydemo.io]()

This one depends on a honeycomb API key secret that I threw into my cluster, and it reports to o11y-xp-workshop team, prod env.
    
---
title: Developer tools for Cloud Run
description: In this article, we cover different useful tools you could use if you want to fully enjoy Cloud Run, like Debugger, Cloud Logging, Profiler and Buildpacks.
image: /articles/developer-tool-cloud-run/main.png
alt: Cloud Run logo
readingTime: 5 minutes
createdAt: 2021-04-22
author:
  name: Thibault Ruaro
  bio: Thibault is a Google Cloud Professional Architect & Developer, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# Developer tools to enhance Cloud Run development

Cloud Run is the next generation of serverless solution offered by Google Cloud. It allows you to execute an [OCI image](https://opencontainers.org/) (Docker image for instance) of your choice on Google Cloud servers.

For those who are more familiar with App Engine Standard environment, the main difference is that Cloud Run gives you the choice of the runtime environment for your application. Usually, App Engine provides a set of runtimes (Java, Node, Python...) that will execute your application. It frees the developer from the burden of packaging the application. However, it restricts the possibilities to use the latest version of a runtime environment (like Java 16 for instance).

Running OCI image gives you a lot of flexibility. But at what cost? You now need to provide such an image to package your application. A common way to do so, can be to create a Dockerfile that contains the instructions to containerize your application.

As a developer, we, sometimes, like having access to some metrics, data or resources computation used by our application. In this article, we will see how you can:
* See the logs of your Cloud Run application
* Debug on production your application with no impact on performance
* Profile your applications to monitor CPU usages and other metrics

## Cloud Logging - Check your application logs

Logs have always been an important aspect for an application whose lifetime is intended to be for couples of years. You need to keep in mind that one day, something will go wrong on your application. And when it does, you better be ready to investigate.

The first reflex everybody has when the application is down, either partially or totally, is to check the logs trying to find the root cause of the issue. That makes total sense, since it is easier to fix something when we know what to look for.

The [12 factor apps](https://12factor.net/) (a set of best practices when developing containerized application) states "[An application] should not attempt to write to or manage log files. Instead, each running process writes its event stream, unbuffered, to `stdout`". This means you should only focus on logging behaviours and data to the console. Leave log capture & aggregation to the Ops.

If you respect this principle, you can easily use [Cloud Logging](https://cloud.google.com/logging/docs) to monitor your Cloud Run services logs, aggregate them and define alerts, or custom metrics about your application.

![Cloud Run specific revisions logs into Cloud Logging](/articles/developer-tool-cloud-run/logging-cloud-run.png)
> In this screenshot, we see the output for the revisions `cloudrun-developer-00005-xuh` (a revision is an immutable running instance of your application). But we could filter for the Cloud Run service `cloudrun-developer` for instance, or all Cloud Run resources...

You do not have to access the server anymore, making a `tail -1000f /my/log/file.log` or any command you were used to. You have a great Web Interface, collecting and showing the logs of all your services. Therefore, it is easy to apply filters to see the output of a specific Cloud Run service, or filter by `Correlation-ID` to track a transaction across all your services.

If you wish to access the global documentation about Cloud Logging and Cloud Run, [here is the link](https://cloud.google.com/run/docs/logging).

## Cloud debugger

I know, I know... My code is perfect, and there is no such thing as a "Bug"... So why bother using a Debugger in the first place...

As great and magnificent you and your code can be, I am sorry to break it to you, but you (of course, not me 😝) will face undesired behaviors in your application. When it happens, you will be happy to be easily able to debug your application.

What if I told you there is a way. You can debug your application while it is running in production, with no impact on your user experience ? Sounds too good to be true, keep reading.

If you were familiar with App Engine, you might have already used the [Cloud Debugger](https://cloud.google.com/debugger) service of Google Cloud. Any AppEngine application can be linked to Cloud Debugger in order to debug your application while it is running. If you tried Cloud Run recently, maybe you realized this feature was not natively provided and you felt betrayed... But it is still possible to enable it.

Cloud Debugger lets you inspect the state of your application by providing:
* The possibility to take **snapshots** of your code. If you run a Java application, you will see the stacktrace and the variables/parameters value.
* The possibility to create **logpoints** in your code. This logpoint will send a log in Cloud Logging when the user hits the logpoint. Following a specification, you can log existing variables or statements to help you monitor your application directly in production.

### Installing the Agent

Deploying an application on app engine includes in the container, an agent capable of interacting with Cloud Debugger. To enable the same service for Cloud Run, it is as easy as it sounds: you need to install the same agent in the OCI image you provide to Cloud Run.

Following [this documentation](https://cloud.google.com/debugger/docs/setup/java), here is how you can install the agent:
```dockerfile
# Create a directory for the Debugger. Add and unzip the agent in the directory.
RUN mkdir /opt/cdbg && \
    wget -qO- https://storage.googleapis.com/cloud-debugger/compute-java/debian-wheezy/cdbg_java_agent_gce.tar.gz | \
    tar xvz -C /opt/cdbg
```

Once installed, just add some variables to your `java -jar` command line:
```dockerfile
CMD java \
   -Dcom.google.cdbg.breakpoints.enable_canary=true \
   -jar PATH_TO_JAR_FILE
```

Then, when running your Cloud Run service, you need to provide environment variables to complete the Debugger agent setup.
```shell script
JAVA_TOOL_OPTIONS=-agentpath:/opt/cdbg/cdbg_java_agent.so
```

### Using Source Repositories

To be able to create **snapshots and logpoints**, Cloud Debugger needs to have access to your source code. Cloud Debugger then displays your source code in the UI, and you just have to navigate to your code to create a snapshot or a logpoint.

A practice for such use cases would be to sync your github repository with Source repositories. [Follow this link to do so](https://cloud.google.com/source-repositories/docs/mirroring-a-github-repository?hl=en).

### Example of logpoints and snapshots

You can manage logpoints and snapshots through the Debugger service in Google Cloud. Once the Cloud Run service is deployed with the Debugger Agent, and Source Repositories sync with your code, you can simply use the Debugger service. If you want a step by step procedure, [you can follow this link](https://cloud.google.com/debugger/docs/quickstart)

Logpoints are points in the program that will send a log message into your service logs. These logs are collected by Cloud Logging as well, fitting nicely into your existing application logs. [To know how to create Logpoints, follow this link].(https://cloud.google.com/debugger/docs/using/logpoints#console)

In this example, I created 3 logpoints in the same method of my Controller. When the user asks for a new Todo creation, the logpoint will be triggered and will send the message to Cloud Logging.

```text
logpoint("task={createTodoDTO.task}, dueDate={createTodoDTO.dueDate}")
logpoint("createTodoDTO={createTodoDTO}")
logpoint("{createTodoDTO.toString()}")
```
![Logpoints example in the Debugger service](/articles/developer-tool-cloud-run/debugger-logpoints-example.png)

You need to follow some Google Cloud logpoints specification in order to know what expressions you can use (For now, I am not able to find the complete documentation...). Here is the result in Cloud Logging.

![Logpoints output in Cloud Logging service](/articles/developer-tool-cloud-run/logpoints-output-cloud-logging-service.png)

For Java, I noticed 2 interesting things:
* Logging object does not seem to perform a deep reflection `LOGPOINT: createTodoDTO={ task: "a todo", dueDate: <Object> }`. Here, you see the `dueDate` is logged as `object`.
* You can't make any method call. The logpoint `createTodoDTO.toString()` logged an error: `LOGPOINT: Method dev.truaro.blog.cloudrundeveloper.CreateTodoDTO.toString blocked (INVOKEDYNAMIC instruction not supported)`

A snapshot works in a similar way, but the output is different. Instead of seeing logs output, you can directly inspect the stacktrace, and the current state of the object in the scope (`this`, parameters, variables...). [To have a step by step snapshot creation, follow this link](https://cloud.google.com/debugger/docs/using/snapshots).

In this example, I created a snaphshot before calling the `todoRepository`. Here is the result:

![Snapshots example in Debugger service](/articles/developer-tool-cloud-run/debugger-snapshots-example.png)

You can see on the right side 2 interesting panels:
* Variables: Display the content of `this`, your method parameters and the variables you created.
* Call Stack: Display the stacktrace the lead you to your current snapshot.

> Please note a snapshot does not stop your execution, it simply collects data, but does not affect the user experience.

> * Be also careful, the debugger is linked to a revision of your service. If you deploy a new revision, you will have to configure the Debugger to communicate with the new services.
> * Besides, your application needs to be running before creating LogPoints and Snapshots, otherwise the debugger agents will not send data to the Debugger service.

## Cloud Profiler

Cloud Profiler is a service provided by Google Cloud to help understands the performance bottlenecks of your application. By analysing your application with Cloud Profiler, you can quickly spot what is causing the slowness in your application, and take actions to fix it.

### Installing the Agent

Just like Cloud Debugger, profiling an application requires the installation of the Profiler Agent in the OCI image deployed on Cloud Run.

Following [this documentation](https://cloud.google.com/profiler/docs/profiling-java#gke), here is how you can install the agent:
```dockerfile
# Create a directory for the Profiler. Add and unzip the agent in the directory.
RUN mkdir -p /opt/cprof && \
   wget -q -O- https://storage.googleapis.com/cloud-profiler/java/latest/profiler_java_agent.tar.gz \
   | tar xzv -C /opt/cprof
```

Then, when running your Cloud Run service, you need to provide environment variables to complete the Profiler agent setup. Here is a combination I found useful to monitor a Spring Boot application:
```shell script
JAVA_TOOL_OPTIONS=-agentpath:/opt/cprof/profiler_java_agent.so=-cprof_service=<SERVICE_NAME>,-cprof_enable_heap_sampling=true,-cprof_cpu_use_per_thread_timers=true
```
* `-cprof_service=<SERVICE_NAME>`: provide the name of the service that will be used in Cloud Profiler. Usually, use the same name as the Cloud Run service.
* `-cprof_enable_heap_sampling=true`: Enable Heap sampling. Only available for Java 11 and higher.
* `-cprof_cpu_use_per_thread_timers=true`: Samples the CPU times per thread more precisely. Can add a little overhead, but as you run your application with multiple threads, it can be a useful metrics to have.

### Profiling your application

Cloud Profiler works by collecting profiles of your running application. The profile agent communicates with the Cloud Profile backend API and sends profiling data every minute on average.

The Profiler can manage different information:
* **CPU Time**: The most basic metrics every developer should be familiar with. It is the time spent by the CPU on your method execution. It doesn't calculate the time spent on other resources. Of course, if your application spent most of its time waiting for a resource, you might find that the CPU time does not reflect well your application execution process. That is why, you need other metrics to know how long a method took.
* **Wall Time**: The total amount of time spent between the method call until the method returns. The Wall time will always be higher than the CPU times, as it will also track the time you spent waiting for a resource.
* **Heap memory usage**:
  * **Heap**: The amount of memory allocated in the program  at a single point of time. It does not store the allocation during the program execution. To do so, there is the Allocated Heap metric.
  * **Allocated Heap**: The allocated heap during the interval. Takes into account memory that has been allocated and memory that has been freed.
  
Unfortunately, not all metrics are available for all languages. For the full list of supported metrics, [check the official documentation](https://cloud.google.com/profiler/docs/concepts-profiling).

### Data representation in Cloud Profiler UI

Before showing you a screenshot of the UI for my sample application, I think it is necessary to tell you how the data is represented. The final representation is a **Flame Graph**, which is an optimized and space efficient representation for a very large amount of information.

![Flame graph concept](/articles/developer-tool-cloud-run/concept-flame-create.png)

You can find more information in [this documentation](https://cloud.google.com/profiler/docs/concepts-flame). It is unfamiliar at first, but once you are used to it, it is easier to read.

### Example

In my example, I profile a Spring Boot Java 11 application. Therefore, I can only monitor:
* CPU Time
* Wall Time
* And Heap usage

I created a Controller designed specifically for time consuming resources. Here is the code of the Controller:
```java
@RestController
public class TimeConsumerController {

   @GetMapping("/consume")
   public void consume() {
       for(int i = 0; i < 1000000; i++) {
           Random random = new Random();
           int i1 = random.nextInt();
           int i2 = random.nextInt();
           int i3 = i1 + i2 + i;
           System.out.println("i3 = " + i3);
       }
   }
}
```
> A simple loop, that generates random numbers, sums them and displays the result in the standard output.

After a couple of API calls, I got the following CPU time graph:

![CPU Time cloud profiler graph](/articles/developer-tool-cloud-run/cpu-time-cloud-profiler-graph.png)

As a reference, here is the Wall Time graph:

![Wall time cloud profiler graph](/articles/developer-tool-cloud-run/wall-time-cloud-profiler-graph.png)

In terms of seconds spent on the method, the Wall Time is 8.95s and the CPU Time is 5.13s.

With an application dealing with multiple users, you could have more useful metrics and time spent in specific methods, helping identify bottlenecks.

IMHO, the Cloud Profiler with Spring Boot is not very practical to profile specific business code and not framework code. Indeed, I spared you from the global Profiler graph, but you mostly see framework related methods, which can make it harder to find bottlenecks in your business code. Obviously, your application needs to be used in order to overcome the cost of the framework.

## Cloud Trace

The last service you need to know is [Cloud Trace](https://cloud.google.com/trace/docs/setup). Its purpose is to **monitor the latency** of your requests when users call your application. In a nutshell, latency is the time delay the user waits before receiving the response from your application.

This service is automatically configured to monitor your Cloud Run services, which makes it very easy to use. Here is a screenshot of the latency of several requests I have made for the test.

![Cloud Trace example](/articles/developer-tool-cloud-run/cloud-trace-example.png)

Reading this graph is quite straightforward:
* The blue dots represents the latency of a request
* You can see the request with the longest latency took 15 seconds. This request started the Cloud Run service, which is why it took so long
* You can see some requests taking around 10 seconds. These requests were hitting the `/consume` API (remember the API I created earlier ?)
* For most of the requests, it took around 50ms to handle a GET on `/todos`, which is great. It means the user almost never waits to get a request that went through your Cloud Run and Datastore.

Of course, by default, not all requests are logged. Doing so would increase too much the volume of data, and your usage bill at the same time.

Cloud Trace offers other features that are not detailed here, like:
* Building insightful graph to monitor accurately your application
* Monitoring requests made by your application to another application to calculate the global latency
* Exporting the data to aggregate your trace the way you need
* Providing data about the user who generated the request, like its country, its region, its city...

> The tool I used to generate some traffic is [siege](https://linux.die.net/man/1/siege), a Linux tool to generate concurrent traffic on an endpoint. Here is the command line I used: `siege -c 3 https://...`


# Conclusion

I hope you have a better view of some developer tools that could make your life with Cloud Run easier. To go further, there are also tools about latency and error reporting. Please, find below the list of the resources we went through together:
* [CNCF website](https://www.cncf.io)
* [The 12 apps factor](https://12factor.net/)
* [A great video explaining The 12 apps By Julien Landuré](https://www.youtube.com/watch?v=qlF378oDqW8&list=PLdVDu8iO6zrMurVwGrFR23uw5OtGh4vFx&index=5)
* [Deploy your source code with Cloud Run](https://cloud.google.com/blog/products/serverless/build-and-deploy-an-app-to-cloud-run-with-a-single-command)
* [Cloud Logging concepts](https://cloud.google.com/logging/docs/concepts)
* [Debugger Quickstart](https://cloud.google.com/debugger/docs/quickstart?hl=en)
* [About Profiler](https://cloud.google.com/profiler/docs/about-profiler)
* [About Cloud Trace](https://cloud.google.com/trace/docs/setup)

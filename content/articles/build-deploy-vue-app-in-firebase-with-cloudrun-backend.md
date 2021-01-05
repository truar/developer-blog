---
title: Build a Vue app with Firebase and Cloud Run
description: To continue with the series consisting in deploying a full application in GCP, we will focus on building and deploying the frontend with Vue, using Firebase and Cloud Run.
image: /articles/build-deploy-vue-app-in-firebase-with-cloudrun-backend/main.png
alt: Vue and Firebase Logo
readingTime: 9 minutes
createdAt: 2020-12-06
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# Introduction

Building a rich and powerful web application has never been so easy and so complicated at the same time. The web expanded really fast, and with it, the need to build more and more advanced applications. Empowered by some great frameworks wishing to simplify your life as a Frontend developer, you can easily start following some tutorials and documentation, and in the meantime, being totally lost in the wide eco-system you can now face. The time when we manipulated the DOM ourselves is now gone, and we must embrace advanced architectural style whose purpose is to ease the application maintenance and evolution.

Those famous Web frameworks, you might know them already, even only by name. There are three main ones:
* Angular, supported by Google developers team
* React supported by Facebook developers team
* Vue, supported by a community of developers sharing passion for frontend development

Despite the fact Vue was not maintained by one of the [GAFAM](https://en.wikipedia.org/wiki/Big_Tech), it is nowadays a great framework used widely, even [by the GAFAM themselves](https://www.netguru.com/blog/13-top-companies-that-have-trusted-vue.js-examples-of-applications). Besides, as Vue is the framework I enjoyed the most, it is the one I chose in this article to build the frontend part of the application.

Developing an application is now accessible quickly to the most, but deploying this application and making it accessible is quite another challenge. Not everyone is comfortable with server administration and deployment tasks. Hopefully, Google comes with an answer: Firebase. 
> Firebase is a platform developed by Google for creating mobile and web applications. It was originally an independent company founded in 2011. In 2014, Google acquired the platform and it is now their flagship offering for app development. -- Google

In other words, Firebase makes it easier for you to host your application by offering complete server management. Your app is easily scalable, which means it can support load peaks, and accessible worldwide, for almost a penny. Under the hood, Firebase uses Google Cloud Platform technology to host your application. This makes easy to have a Vue application accessible 100% of the time for free (almost but clearly, you won't pay much) communicating with another backend application hosted on GCP, like Cloud Functions or Cloud Run.

In this article, we will focus on developing a Vue application communicating with the Spring Boot application hosted on Cloud Run [we developed in the previous article](/deploying-an-app-in-gcp-part1). We will host it using Firebase and deploy it by improving the Cloud Build pipeline [we covered in the second article](/continuous-deployment-with-cloud-build).

## Prerequisites

* **Node.js**: an open-source javascript runtime environment. You need it in order to run javascript code outside of a browser. To install Node, [follow this link](https://nodejs.org/en/download/package-manager/)
* **Yarn or NPM**: a package manager to download the different libs you need to build your application. If you come from the Java world, you might know Maven or Gradle. Those are famous package manager for java application. For frontend development, I will use Yarn. To install Yarn, [click here](https://classic.yarnpkg.com/en/docs/install/)

# Building the VusJS application

Vue team released recently the third version of Vue. We will not cover differences between Vue 2 and Vue 3, but let's use the latest versions available.

Remember the folder trees we had in the previous articles?
```
* gcpapplication
|--- gcpcloudrunback (this one has been created in the first part)
|--- gcpfirebasefront (you migh not have this one yet)
```

In this article, we will create the `gcpfirebasefront` folder. Don't do it manually, we will create it automatically in the next section.

## Creating the application using vue-cli

First, [follow the official documentation](https://cli.vuejs.org/guide/installation.html) to install or upgrade the vue-cli. If you already have, I recommend upgrading to the latest version (4.5.9 at the time of the article creation), as you can use Vue 3.

Considering your are located in the `gcpapplication` folder, run
```shell
vue create gcpfirebasefront --preset __default_vue_3__
```
> * It might take a couple of minutes, just be patient.
> * The preset Vue 3 is very minimal using babel and eslint. It will be more than enough for our application.

For the rest of this part, we will only be located inside the folder `gcpfirebasefront`.

## Configuring the application

Let's create a file `vue.config.js` at the root of `gcpfirebasefront`:
```js
// vue.config.js
module.exports = {
    devServer: {
        port: 8088,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                ws: true,
                changeOrigin: true
            }
        }
    }
}
```
> * `devServer.port`: By default, the development server port is `8080`, which will conflict with our backend application. Let's change it to `8088`
> * `devServer.proxy`: Create a middleware proxy to change the origin of request targeting the `target` attribute. This is very convenient in order to avoid CORS configuration. This way, the browser sends a request to the same server as the Frontend, and the proxy is in charge of calling the backend service by changing the Origin.

## Calling the backend server to change the display

If you take a look into the Vue application generated by `vue-cli`, you can see several folders. The interesting one in our use case will be `src`, which contains the application `js` files. Let's update `src/App.vue` to add an interaction with our server, and display the Welcome message coming from the server:
```vue
// src/App.vue
<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <HelloWorld :msg="message"/>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  data: () => ({
    message: 'Loading...'
  }),
  async created() {
    const response = await fetch('/api/')
    this.message = await response.text()
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

Let's focus on the changed lines:

```vue
<HelloWorld :msg="message"/>
```
> We bind the property `msg` of the `HelloWorld` component to an attribute from our component inner `data`.

Here is the creation and the modification of the `data` part:
```js
export default {
  // ...
  data: () => ({
    message: 'Loading...'
  }),
  async created() {
    const response = await fetch('/api/')
    this.message = await response.text()
  }
}
```
> * Set `Loading...` in the `message` attribute by default. 
> * Fetch the data from the server when Vue calls the `created` method. This method is part if vue lifecycle and is called automatically at component creation.
> * As you might notice, `fetch('/api/')` shows the backend server is not directly targeted. Instead, the proxy intercepts the request and change apply corresponding changes according to the `devServer.proxy` configuration.

## Test locally the application

Just like a cook tasting every part of his meals to make sure it is delicious and has the expected taste, you must taste (😅) &nbsp; your application at each step. We could have done one to test the creation using `vue-cli` but for the article length sake, I decided not to.

Now, let's try if our frontend is properly communicating with our backend. Open 2 terminals, and from the folder `gcpapplication`, run:
```shell
# terminal 1
cd gcpcloudrunback
./mvnw spring-boot:run
``` 

```shell
# terminal 2
cd gcpfirebasefront
yarn serve
# or npm run serve depending on what is installed on your application
```
Open your browser and navigate to `localhost:8088`. You should see something like this: ![Local integration between Vue and Spring success](https://dev-to-uploads.s3.amazonaws.com/i/hqcdsgmeir2umqzxq7g1.png)

> If you see something different than `Hello World. I am deployed automatically`, that means you may have missed a step. Read back, and come back again when it is working. Otherwise, you'll miss the best part: deploying in Firebase.

# Deploying the application on Firebase Hosting

Firebase Hosting is a great solution to host static websites (like Single Page Application) where the content of the files is static (like a javascript application). With the Hosting solution, you pay depending on your website size. The more files you have, the more expensive is the bill. For this article, the Hosting solution is free given our very small project.

## Connect on Firebase and add your project

### Import your GCP project to Firebase

The first thing is to add your GCP project to Firebase (created in [the first article](/deploying-an-app-in-gcp-part1)). Quickly, just log in to firebase and [go on this URL](https://console.firebase.google.com/u/0/). From there:
1. Click on `Add Project`.
2. Select the one you created previously.
3. Accept or not using Google analytics. For this project, we don't need it. It is up to you.
4. Accept the terms and conditions
5. Let firebase prepare your project.

### Prepare your environment

Once the project is set, install the Firebase CLI locally to execute some commands. To do so, [follow the official documentation](https://firebase.google.com/docs/cli).

After the installation, run this to make sure it works:
```shell
firebase --version
8.16.2
```
> 8.16.2 was at the time of the article creation. You might have a different output.

## Initialize your Firebase project

The Firebase CLI has an `init` command, but it does not support passing all options at once. You need to interact with the CLI, and it is really not convenient for this article. So if you feel like it, you can try running `firebase init`. But for the sake of the article, I'll give the file you need to create.
> If you want to run `firebase init` make sure you are located in `gcpfirebasefront`

Create a file called `firebase.json` in `gcpfirebasefront` with the following content:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
> Quick explanation:
> * `public`: the folder in which are located the production files built by `yarn build`
> * `ignore`: ignores folders/files to be uploaded onto Firebase. As you only pay for the storage, make sure you don't upload unused files.
> * `rewrites`: A rewrite rules mandatory in the case of Single Page Application, to make sure all URLs use the `index.html` file.

These files should be the result if you ran the command `firebase init`. Besides, the `firebase init` command generates a file `.firebaserc`, but we won't need it.

## Connect your Firebase site to Cloud Run

Since recently, Firebase has a convenient way to redirect some HTTP requests to a Managed Cloud Run service. To do so, the `firebase.json` file needs to configure the `rewrites` rule. Add a new `rewrite` rule like this as the first `rewrites` array element:
```json
{
    "source": "/api/**",
    "run": {
        "serviceId": "gcp-cloudrun-back",
        "region": "europe-west1"
    }
}
```
> * `source`: Redirect HTTP request `api` to the Cloud Run service
> * `run`: The Cloud Run service name `serviceId` and the `region`. Remember [from the first article](/deploying-an-app-in-gcp-part1), we deployed a Cloud Run service called `gcp-cloudrun-back` in the region `europe-west1`.
> 
> This configuration is really great to avoid `CORS` configuration, where most of the time, this can lead to security issues if not thought carefully. So if possible, let's avoid those problems.

Here is the final form of the `firebase.json` file:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
    {
        "source": "/api/**",
        "run": {
          "serviceId": "gcp-cloudrun-back",
          "region": "europe-west1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
> Note the rewrites rules order, first matched first served.
 
## Deploy the application on Firebase

Now, let's use the `firebase` CLI to deploy our application:
```shell
yarn build
firebase deploy --project=${PROJECT_ID} --only hosting

...
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/truaro-resources/overview
Hosting URL: https://truaro-resources.web.app
```
> * Replace `${PROJECT_ID}` with your Firebase Project Id. 
> * `HOSTING_URL` is your application URL.

Now, you can access your application on Firebase using the `Hosting URL` firebase gave you after the execution of the deployment command. The webpage displayed should be the same as the local test we did earlier: ![Firebase and Cloud Run integration success](https://dev-to-uploads.s3.amazonaws.com/i/hqcdsgmeir2umqzxq7g1.png)

> You might first see `Loading...` a couple of seconds before seeing `Hello World. I am automatically deployed`. Don't worry, it only means your Cloud Run service is booting. Once Cloud Run is up, the communication with the server is very fast and you won't even see `Loading...` anymore. 

# Summary

🎉&nbsp; Congratulations !! If you made it, here is what you accomplished:
* Creating a Vue 3 application using the `vue-cli`
* Fetching data from your server with a Proxy configuration to avoid CORS request
* Configuring a Firebase project to use the great `Hosting` solution
* Use the `firebase` CLI to deploy your first website on Firebase 
* Configure your Firebase website to communicate with a Cloud Run service

## What's next

To go further with this vue application, you could:
* Enhance it by [adding a router](https://router.vuejs.org/)
* Improve the design using a nice component library, like [Vuetify](https://vuetifyjs.com/en/) or [Quasar](https://quasar.dev/)
* Use a CD pipeline using Cloud Build to automatically deploy your application using Cloud Build (coming in a next article)

## Resources

* [Vue, React and Angular usage comparison](https://www.tecla.io/blog/2019-stats-on-top-js-frameworks-react-angular-and-vue/)
* [Configuring Vue application](https://cli.vuejs.org/config/)
* [Vue lifecycle diagram](https://v3.vuejs.org/guide/instance.html#lifecycle-diagram)
* [Firebase hosting full configuration](https://firebase.google.com/docs/hosting/full-config)
* [Firebase and Cloud Run communication](https://firebase.google.com/docs/hosting/cloud-run)
* [Vue router](https://router.vuejs.org/)
* [Vuetify](https://vuetifyjs.com/en/)
* [Quasar](https://quasar.dev/)

---
title: Behavior driven development (BDD) - Feedback on our journey
description: Behavior driven development enables developers and business experts to share the same language and define together expectations to ensure a feature is fully functional. Full of promises, the journey to is far from being easy, and challenges arise as the project moves forward. Let's delve deeper how we implemented a solution in our team.
image: 
alt: BDD logos
readingTime: 15 minutes
createdAt: 2022-03-14
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# My feedback on the implementation of Behavior Driven Development (BDD)

The purpose of this article is to provide a feedback of the implementation of BDD in the project developed by the team I operate as a Tech Lead. The team is composed of Business Analysts (6), Developers (7) and a Project Manager (also operating as the Product Owner). 

During the development of the project, as the stories were delivered, we quickly faced some regressions on the UI under development. As it was reducing the quality of our delivery and impacting our velocity, we decided to move toward an approach that we hoped could help us overcome these issues. This is where we stared to look into Behavior Driven Development (BDD) and what it could bring to the project.

As of now (2022-03-05), the project is still under development. I don't know yet if our solution will work on the long run, but I wanted to share the things we struggle on and what solution we found. I hope this wil give you insights on how you can also do the same for your project(s).

## Introduction to BDD

I'd like to start with a quote from ["Wikipedia"](https://en.wikipedia.org/wiki/Behavior-driven_development) regarding the definition of BDD :
> In software engineering, behavior-driven development (BDD) is an agile software development process that encourages collaboration among developers, quality assurance testers, and customer representatives in a software project. It encourages teams to use conversation and concrete examples to formalize a shared understanding of how the application should behave.

Put it simply, the purpose is to create a strong collaboration between the developers and the testers to create a test base that will ensure the feature is fully developed and matches all the requirements. These requirements can be documented using the Gherkin language, and even executed automatically using different tools.

Let's make it clear now, BDD is not about the tool you use. It is about the communication inside your teams, to engage every one toward a shared goal: delivering stories the right way.


## Our implementation of BDD

Wanting to do BDD is great, but it is not enough. BDDs is not easy to implement either, and there is a lot of problems that could rise if you are not being careful. Let's review the challenges we faced, one by one, and the solution(s) we found.

### Writing the Gherkin files

Just by writing a Gherkin files, there are many questions that needs to be addressed, otherwise, the very base of BDD will prevent from going further.

#### The very basis of Gherkin (for information)

Gherkin defines features as a set of scenarios. Each scenario is a succession of a Given, When and Then steps.
* Given: The context in which your tests will be executed. It can define the dataset, the current state of the application, a browser location...
* When: The action(s) you would have performed manually
* Then: The validation of the impact of the previous action(s). In other word, what would make the scenario a success ?

#### Problem: No communication between BAs and Developers

Early in the project, the Business Analysts were given the task to write gherkin scenarios inside JIRA using X-Ray (I won't comment on that here, but I find it quite a waste of time). Anyway, as good workers, they started to write them. When I learned about this I was shocked... I thought of so many things that could go wrong... 
* How could they know if their gherkin scenarios was written properly ?
* Could we only automate them ? It would have been a total waste if they were writing tests we couldn't automate
* Where is the communication with the developers ? Why are they not even in the writing of those gherkin scenarios ?

By starting the writing of the Gherkin files without consulting the developers, the approach could only be a failure.

#### Solution: At the beginning of a story, both a developer and a BA take 1 hour to write the gherkin scenarios.

This 1-hour meeting should be used to create the gherkin scenarios to validate the feature. Besides, we limited the meeting to 1 hour in order to timebox the workshop with the meaning: If it takes more than 1 hour to write the scenarios, maybe the story is too big...

Anyway, this meeting is supposed to create communication between BAs and Developers, create the gherkin files and giving the developers some good insights and examples to implement the feature.

We were inspired by the ["Three amigos"](https://automationpanda.com/2017/02/20/the-behavior-driven-three-amigos/), where usually, the Developer, QA and BA brainstorm together to write acceptance criteria in the form of Gherkin scenarios. Without QA, let's call this, the "Two amigos".

#### Problem: Unmaintainable nor understandable Gherkin scenarios

The client focused only on the What (writing gherkin scenarios), but not on the Why (why are we writing gherkin in the first step) nor the How (how can we write quality gherkin scenarios). It was obvious to me that we couldn't let the BAs keep writing gherkins without the opinion of the developers. Besides, without a proper training, the gherkin written were far from being readable by a tool, and far from being maintainable.

#### Solution: Train both the developers and the BAs on how to write a Gherkin scenario

During 2 weeks, we had daily meetings with the entire team (BAs and developers) and we implemented the first gherkin scenarios. Then we ended up with a set of common steps, a shared vocabularies and nice examples we could follow to write the next scenarios.

Basically, we follow these principles: 
* We do not allow a When after a Then. Focus on simple scenarios
* Have business oriented steps do not rely on UI implementation details.
* The scenarios should contain the context to execute the test

For more information, you can check these links:
* [Writing better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)
* [Better behavior-driven development: 4 rules for writing good Gherkin](https://techbeacon.com/app-dev-testing/better-behavior-driven-development-4-rules-writing-good-gherkin)
* [BDD 101: WRITING GOOD GHERKIN](https://automationpanda.com/2017/01/30/bdd-101-writing-good-gherkin/)

#### Problem: Too much context to give

Usually, it is always best to have all the context contained inside the scenario. We do not want to understand the context by taking into consideration another part of your application, or relying on some hidden meanings that no one knows about. So basically, it is best to have:
```gherkin
Given A, B, C
When I do an action
Then X, Y, Z
```
Here is what I like here :
* The context is explicit, you know exactly in what state you are
* The action is clear and simple
* The assertion depends directly on the context. If I change the Context, then the assertion will change too, because both are strongly connected.

Now, let's look an example I do not like:
```gherkin
Given some standard test data
When I do an action
Then X, Y, Z
```
Do you see the problem here ? What means "standard test data" ? Where are those data ? How do I know what part of this dataset is directly responsible for impacting the assertion ? In the long run, this kind of tests are less maintainable. If someone changes the "standard test data", how can that person knows the impact it will have on the tests ? Usually, this ends up with a comment indicating "FIXME", and nobody has the time to fix it... So we give up on the test.

But sometimes, it can also be difficult to have a Given. Suppose you need a wide context, or you have an enormous dataset (like 50 attributes or more on a single object), should you write everything in the gherkin ? Something like:
```gherkin
Given a particular object
And another object
And this one here
And A, B, C, D, E, F, G, H, I, J, K, L, M, ...
```
Once again, how can you maintain such a gherkin scenario ? And what if these steps are the minimal steps for all others scenarios... what a mess.

#### Solution: Define a Business oriented Dataset

We mixed up both gherkin above. We created a small dataset (2 to 3 objects, no more) that represented some business use cases. The dataset needs to be maintained by the BAs, and any story impacting the data should be reflected in the Dataset, always with a business meaning. So to give some context, we wrote the following Given
```gherkin
Given the object "OBJECT NAME"
```

Even if the context depends on something else, an object somewhere else in the code, at least, it is explicit which one. This gives us more visibility on the impact if we decide to change the object "OBJECT NAME".

Remember that Object is *business oriented*, this is key in order to maintain this object, and your scenarios. It must tell a story. Why is the object in this state ? How did it end up there ? Why is this field in that state ?

And keep in mind that if you have a new story that modifies an object from your dataset, you must provide a business justification of the impact and a value for the new/existing field. Do not let developers use a default value. A business oriented dataset is critical, and is costly to maintain, which is the reason why you need to have only few objects.

I recommend reading this article: [BDD 101: TEST DATA](https://automationpanda.com/2017/08/05/handling-test-data-in-bdd/) for more information about Test Data.

#### Problem: Testing every possible combination

Usually, once we start having gherkin scenarios, we tend to test everything that we can. Good for you, the more tests, the better ? But is it realy ? You need to keep in mind that testing a UI application takes time:
* It takes time to write the tests
* It takes time to implement the tests
* It takes time to execute the tests (and also lots of compute resources)

So before adding a new test, and trying every possible combinations, ask yourself whether it is worth the time it will cost.

#### Solution: Focus on things that gives you confidence

Instead of testing every possible combination, try to see if you can not merge all the scenarios in one test ? For example, we have a filter available on the dashboard. The user can filter by name, type, matriculation number, and so on... Should we test each filters separately, or could we just test all of them at once ? We did this :
* We tested independently the critical filter on their own that correspond to a regular business case (like filtering only by name, or matriculation number, so 2 tests)
* We tested the other filters altogether (1 test for 8 filters)

Is it perfect ? Certainly not... But I know that I'm confident. I have confidence that the first filters corresponding to 90% of the filters will work, and I'm confident that all the filters work together.

#### The shape of our gherkins file

To put it all together, here are some of our gherkins file:
```gherkin

```

### Automating the execution of the gherkin files

Once the gherkins are properly written, the developers can work on automating the execution. The purpose is simple: Checking that the new story is fully implemented, and ensuring a small no regression for the others.

But the implementation is far from being easy, here are the solutions we use.

#### Cypress & Cucumber

Cucumber is a tool that reads Gherkin files, and enables the developers to execute code based on the content of a scenario.
Cypress is a tool that interacts with a browser and simulates user interaction by following what the developers asked cypress to do (clicking on a button, typing text in a field, visiting a page...). 

Both can be used together to automate the gherkin scenarios execution with a tool that interacts with a Browser and executes all the actions a human would have done to manually validate the story.

Here is the [GitHub link](https://github.com/TheBrainFamily/cypress-cucumber-preprocessor) for documentation and installation.

#### Page Object Pattern

To avoid too much coupling between the gherkin scenarios and your UI, we can use the Page Object Pattern, as described [here](https://martinfowler.com/bliki/PageObject.html) by Martin Fowler. 

Put is simply, a Page in your UI is represented by an Object, and this object exposes meaningful method to interact with the Page.

#### Doubling the servers

In a microservice architecture (like ours), the UI usually requires many services to be up and running in order tto display meaningful data to the user. To execute tests and make sure they are reproducible, we need to protect them from any external changes. Relying on an existing environment is risky because your tests could fail not because of your new code, but because someone changed the data on the environment... To avoid this pitfall, we need to rely on an isolated environment for your tests.

We used [json-server](https://github.com/typicode/json-server) to start a RestFul server, storing mock data on `lowdb`. We can use `GET`, `POST`, `PUT` and `DELETE` method on a resource. Combining the json-server with our dataset and the given steps, we can insert the data in the mock server before running the tests, and ensuring the context s fully loaded before executing the actions. 

Json-server is very fast, so it also shortens the execution of your tests.

#### Limiting the scope of the tests

Once again, Microservice makes testing trickier. What services should be up ? What are the boundaries of my tests ? If my test fails, can the developers have an impact and the outcome ?

We split the solution in 2 steps:
* Automating UI tests that doubles every other dependencies (even the backend maintained by our team)
  * This way, we focus on UI development, it helps the frontend developers moving forward and ensuring the UI answer the business needs.
* Automating UI tests that goes to our backend services, and doubling dependencies where we do not have the ownership
  * We always need to make sure our frontend and backend can communicate. In order to avoid a test failing that we can not fix ourselves, we only communicate with backends we have ownership over. This way, if a test fails, we know we can find a solution to make it work.
  
For more information about what to test in a UI application, you can read this article: ["The Testing Trophy and Testing Classifications"](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications).

As of today (2022-03-05), we do not have a solution that works both with every dependency doubled, and only our backend deployed... The reason is linked to the dataset... We do not know how we can insert our dataset in our backends as easily as it is possible on the json-server... 

#### DOM Interaction

With Cypress, you can use the `cy.get(CSS Selector)` method to navigate through the DOM. For example, you could get this: `cy.get('#home .table tr td button')`. But this way of fetching DOM elements make your test more brittle, and probably too coupled with the HTML pages.

To overcome this, we combined 2 solutions:
* Reading [Cypress websites](https://www.cypress.io) and [best practices](https://docs.cypress.io/guides/references/best-practices#Selecting-Elements), they suggest the usage of `data-test` attribute on the key DOM elements used in your tests. Then, simpy use `cypress.get([data-test=...])` to fetch the element. Very handy. But it is not often the best approaches. Let's read the next solution
* We make cypress interacting with the DOM the same way a human would have. A human doesn't know what classes applied on a field or element, most of the time, it knows what to do because it can read a label or something representing the field. So for forms for instance, you can select elements by label, without the need to tag every elements with `data-test` attribute.

For more information about making test resilient to UI change, I recommend the article ["Making your UI tests resilient to change"](https://kentcdodds.com/blog/making-your-ui-tests-resilient-to-change).


## Conclusion

As you read it, you see that we did a lot of research in order to try to implement BDD the right way in the project. I strongly believed we made some good choices and we are moving in the right directions, but only later we will know for sure. To sum up, let's remember this:
* Behavior Driven Development (BDD) is about communication between BAs, QAs and Developers
* BDD brings everyone closer to write acceptance criteria and make sure the developers deliver what is expected
* Writing good gherkins is hard, but can bring you a lot
* Automation requires time and effort, but it is often worth it for long-lived project
* Do not try to test every things possible with Gherkin, as the test execution can take so much time that no one wants to start them. Keep them small and focused and critical parts of your application. The rest can be tested more quickly using simple unit tests.

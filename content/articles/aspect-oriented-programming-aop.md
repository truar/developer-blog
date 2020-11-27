---
title: Aspect-Oriented Programming (AOP) - Preparing the Spring Professional 5.0 Certification
description: Preparing the Spring Professional 5.0 Certification by answering every point you need to know to get ready for the Spring Professional 5.0 Certification regarding the part Aspect-Oriented Programming (AOP)
image: /articles/spring-core-study-guide/main.png
alt: The Spring framework logo
readingTime: 20 minutes
createdAt: 2020-11-28
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# Aspect-Oriented Programming (AOP)
## What is the concept of AOP? Which problem does it solve? What is a cross cutting concern?

Aspect Oriented Programming is the concept of weaving extra behavior during the application execution. The purpose is to solve cross-cutting concerns with a modular approach. 

A cross-cutting concern is a concern that impacts every layer and class of your application. You need to be able to recognize requirements that needs to be solved by AOP:
* Log a message before **every** data modification.
* Check the access roles **for each** methods in the `MemberService`

### Name three typical cross cutting concerns.

Typical cross-cutting concerns are:
* Transactions: encapsulate your code with transactional support. Great example of `@Around` advice.
* Security: perform a security check before entering a method. Perfect example of `@Before` advice.
* Caching: send in-memory data based on previous call. Another example of `@Around` advice.
* Monitoring: send an email after a method throws an exception. Example of `@AfterThrowing` advice.

### What two problems arise if you don’t solve a cross cutting concern via AOP?

When not solving cross-cutting concerns with AOP you end up with 2 problems:
* **Code scattering**: Mix & Match of Security, transactional and business concerns, which blurs the intent and make the code hard to test. Code scattering violates the **Separation of Concerns principle**.
* **Code tangling**: The same code spreads all over your code base, which is harder to evolve and maintain. Code tangling violates the **Don't Repeat Yourself principle**.

## What is a pointcut, a join point, an advice, an aspect, weaving?

* **JoinPoint**: The point in the program where you want to execute your advice. Is it on a method? On a specific class? Only methods annotated by a specific annotation? It depends on your cross-cutting requirements.
* **Pointcut**: An expression targeting a  set of JoinPoints respecting the Pointcut Expression.
* **Advice**: When and what do you want to execute. In Java, an Advice is simply a method containing code implement the cross-cutting concern.
* **Aspect**: A module grouping the extra behavior to enhance the class. Example: SecurityAspect, TransactionalAspect, LoggingAspect... In Java, an Aspect is a class composing of methods (the advices)
* **Weaving**: Technology used to dynamically call the **advices** when the execution of the program matches the **JoinPoints** definition.

## How does Spring solve (implement) a cross cutting concern?

Spring implements a Cross-cutting concern using a **proxy**. When a bean is the target of JoinPoints, Spring wraps the bean around a Proxy to intercept the call and execute the advices.

## Which are the limitations of the two proxy-types?

* JDK Proxy can only proxied a class implementing an interface.
* CGLib Proxy can not proxied a final class or method.

### What visibility must Spring bean methods have to be proxied using Spring AOP?

Spring AOP only supports methods with **non-private visibility**. 

## How many advice types does Spring support? Can you name each one?

Spring supports 5 types of advice.
#### Before Advice
`@Before` executes the advice before entering the target method.
```java
@Component
@Aspect
public class ServiceCallTracker {
    @Before("execution(* HelloWorldService.*(..))")
    public void beforeAdvice() {
        System.out.println("ServiceCallTracker.beforeAdvice");
    }
}
```
> You can block the target execution by throwing an exception in the advice method. Example with Security check, where you can prevent the user accessing a method if it doesn't have the proper roles.

```java
@Component
@Aspect
public class ServiceCallTracker {
    @Before("execution(* HelloWorldService.*(..))")
    public void beforeAdviceBlockingTheTarget() {
        throw new RuntimeException("Target is not reached");
    }
}
```
#### AfterReturning Advice
`@AfterReturning` executes the advice after the target method returns a result
> The target method has to return, not throw an exception.

```java
@Component
@Aspect
public class ServiceCallTracker {
    @AfterReturning(value = "execution(* HelloWorldService.*(..))", returning = "targetResult")
    public void afterReturningAdvice(Object targetResult) {
        System.out.println("AfterReturning advice getting the result from the target method: " + targetResult);
    }
}
```
> You can also target only method returning a specific class. In this case, take as parameter the method return type.

```java
@Component
@Aspect
public class ServiceCallTracker {
    @AfterReturning(value = "execution(* HelloWorldService.*(..))", returning = "targetResult")
    public void afterReturningAdviceForSpecificObject(String targetResult) {
        System.out.println("AfterReturning advice getting only String object: " + targetResult);
    }
}
```
#### AfterThrowing Advice
`@AfterThrowing` executes the advice after the target method throws an Exception. If nothing is specified, the targetException is still propagated.
```java
@Component
@Aspect
public class ServiceCallTracker {
    @AfterThrowing(value = "execution(* HelloWorldService.*(..))", throwing = "targetException")
    public void passingThroughAfterThrowingAdvice(Exception targetException) {
        System.out.println("Passing through AfterThrowing advice: " + targetException);
    }
}
```
> You can intercept only method sending specific exception.

```java
@Component
@Aspect
public class ServiceCallTracker {
      @AfterThrowing(value = "execution(* HelloWorldService.*(..))", throwing = "targetException")
      public void afterThrowingAdviceSpecificException(IllegalArgumentException targetException) {
          System.out.println("AfterThrowing advice only intercepting IllegalArgumentException: " + targetException);
      }
}
```

> The AfterThrowing advice can encapsulate the exception in a new one. Important: you can't stop an exception propagation 

```java
@Component
@Aspect
public class ServiceCallTracker {
        @AfterThrowing(value = "execution(* HelloWorldService.*(..))", throwing = "targetException")
        public void afterThrowingAdviceSendingNewException(IllegalArgumentException targetException) {
            throw new RuntimeException("Encapsulating the exception into a new one", targetException);
        }
}
```
#### After Advice
* `@After` executes the advice no matter how the methods terminated.
```java
@Component
@Aspect
public class ServiceCallTracker {
        @After("execution(* HelloWorldService.*(..))")
        public void afterAdvice() {
            System.out.println("Either the method terminated normally or with an exception. We don't know.");
        }
}
```
> We don't know of it is a success or exception case, but we can execute code if we need to.

#### Around Advice
`@Around` completely controls the target method execution. 
```java
@Component
@Aspect
public class ServiceCallTracker {
    @Around("execution(* HelloWorldService.*(..))")
        public Object aroundAdviceControllingTheExecutionFlow(ProceedingJoinPoint proceedingJoinPoint) {
            try {
                // do things before
                Object proceed = proceedingJoinPoint.proceed(); // call the target method
                // do things after
                return proceed;
            } catch (Throwable e) {
                // do things in case of exception
                throw new RuntimeException("I return an exception. But I could also return a value", e);
            }
        }
}
```
> The advice is in charge of calling the target method manually. If the advice does not call the target, then the target will not be reached.

### What are they used for?
See point above.
### Which two advices can you use if you would like to try and catch exceptions?

To try and catch exceptions, you can use:
* `@Around` advice: You can try and catch the exception sent by the target method around the target method call in the advice.
* `@AfterThrowing` advice: You can catch the exception and send a new one if you need to, after the target has thrown an exception.

## If shown pointcut expressions, would you understand them?
### For example, in the course we matched getter methods on Spring Beans, what would be the correct pointcut expression to match both getter and setter methods?

To match getters and setters, you could use the pointcut expressions:
```java

execution(* set*(*)) || execution(* get*())
```

## What is the JoinPoint argument used for?

The JoinPoint argument is used to manipulate the target object and the arguments passed by the caller to the target method of any advice. The JoinPoint needs to be used with a defensive programming, as it relies on `Object` when manipulating the API.

```java
@Component
@Aspect
public class ServiceCallTracker {
    @Before("execution(* HelloWorldService.*(..))")
        public void beforeAdviceWithJoinPoint(JoinPoint joinPoint) {
            System.out.println("Target bean name = " + joinPoint.getTarget());
    
            String args = Arrays.stream(joinPoint.getArgs())
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            System.out.println("Target method args = " + args );
            
            System.out.println("Target method signature = " + joinPoint.getSignature().getName());
        }
}
```

## What is a ProceedingJoinPoint? Which advice type is it used with?

A `ProceesdingJoinPoint` is used in an `@Around` advice. It gives the advice the possibility to continue the execution flow by calling. 
> See `@Around` advice for usage.

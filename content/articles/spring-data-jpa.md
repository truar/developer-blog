---
title: Spring Data JPA - Preparing the Spring Professional 5.0 Certification
description: Preparing the Spring Professional 5.0 Certification by answering every point you need to know to get ready for the Spring Professional 5.0 Certification regarding the part Spring Data JPA
image: /articles/spring-core-study-guide/main.png
alt: The Spring framework logo
readingTime: 10 minutes
createdAt: 2020-12-19
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# Spring Data JPA

## What is a Spring Data Repository interface?

A Spring Data Repository interface is a basic contract defining methods to data stored in a Database. By default, Spring provides some basic interfaces:
* `Repository`: Default interface with no method included. You need to fully extends the contract.
* `CrudRepository`: Interface with basic CRUD methods, like `save`, `findById`, `findAll`, `deleteAll`...
* `PagingAndSortingRepository`: Interface providing advanced methods to have pagination and sorting behavior when finding data.
> All this interface are generics and requires the extending interface to provide the actual object type and id type

You can extend Spring Interface with your own in order to add specific method to fetch your data against the repository.

## How do you define a Spring Data Repository interface? Why is it an interface not a class? 

To define a Spring Data Repository, simply extends a Spring provided Data interface. It is an interface because Spring will implement the interface at runtime using a Proxy.

```java
public interface MemberRepository extends CrudRepository<Member, Long> {
    Member findByEmail(String email);
}

@Entity
public class Member {
    @Id
    private Long id;
    
    private String email;

    public Member() {
    }
}
```

In this example, Spring will create a Repository to fetch the entity `Member` from a Database. We provide a method `findByEmail`, interpreted and implemented by Spring to generate a query `where email = ?`

## What is the naming convention for finder methods in a Spring Data Repository interface? 

The naming convention for finder method is:
* `find(Distinct|First)By(FieldName)(Ops)(And|Or)(FieldName)(Ops)...`
* `findByEmail` <=> `findByEmailEquals`
* `findFirstByLastName`, `findByFirstNameAndLastName`, `findByLastNameIgnoringCase`...

For complete information, [see this documentation](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods.named-queries)

## How are Spring Data repositories implemented by Spring at runtime?
(See above)
## What is @Query used for?

`@Query` is used to empla

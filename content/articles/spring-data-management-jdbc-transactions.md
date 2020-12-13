---
title: Data management - JDBC, Transactions - Preparing the Spring Professional 5.0 Certification
description: Preparing the Spring Professional 5.0 Certification by answering every point you need to know to get ready for the Spring Professional 5.0 Certification regarding the part Data management - JDBC, Transactions
image: /articles/spring-core-study-guide/main.png
alt: The Spring framework logo
readingTime: 10 minutes
createdAt: 2020-12-28
author:
  name: Thibault Ruaro
  bio: Thibault is a GCP Professional Architect, with a passion for great code. He likes reading about code best practices and staying up-to-date concerning the latest IT subject. He is also an official Spring Core Trainer, where he gives training at Zenika on a monthly basis.
  image: /thibault-ruaro.png
---

# Data Management: JDBC, Transactions

## What is the difference between checked and unchecked exceptions? – Why does Spring prefer unchecked exceptions?

* Checked exceptions are exceptions that are checked at compile time. They can't be ignored and must be either `catch` or declare in a `throws` statement. Given how you use them, they can be seen as a form of coupling if the exception name carries the name of the underlying technology. CheckedException are all exceptions which inherits from `Exception`.
* Unchecked exceptions are exceptions not checked by the compiler. Therefore, it gives the choice to the developers to handle them or not. Unchecked exceptions are all exceptions inheriting from `RuntimeException`. They were originally only designed for Java internal behavior (imagine if your code had to declare `NullPointerException` or relative...) but with the times, the community found the usage of such exceptions easier. 

Spring prefers unchecked exceptions as it gives choice to the developer to decide if they want to handle it or not. Besides, there is a lot of constraints with the Proxyfication. As a reminder, a proxy must have the exact same interface as the target class. Therefore, a proxy can't throw a Checked Exception  not declared by the target class.

### What is the Spring data access exception hierarchy?

The spring data access exception hierarchy is a hierarchy of unchecked exceptions (i.e `RuntimeExceptions`) that encapsulates technical low-level error (like `SQLException`) into an appropriate, meaningful, low-coupling exception. The developer has the choice to catch the exception or ignore it if a higher method is more suited to handle the exception.

For instance, would you like to handle a technical error in your domain ? Or can the Exposition layer handle properly the exception ?

## How do you configure a DataSource in Spring?

To configure a Datasource in Spring, you simply create a `Bean` in a Java configuration class.
```java
@Configuration
public class DataConfiguration {
    @Bean
    public DataSource dataSource() {
        return new EmbeddedDatabaseBuilder().build();
    }
}
``` 
How you create the Datasource depends on your infrastructure. If you want to create a MySQL datasource, simply change the `@Bean` method:
```java
@Configuration
public class DataConfiguration {

    @Bean
    public DataSource dataSource() {
        MysqlDataSource dataSource = new MysqlDataSource();
        dataSource.setURL("url");
        dataSource.setUser("username");
        dataSource.setPassword("port");
        return dataSource;
    }
}
```

## What is the Template design pattern and what is the JDBC template?

Template Method is a behavioral design pattern that defines the skeleton of an algorithm in the superclass but lets subclasses override specific steps of the algorithm without changing its structure.

The JdbcTemplate is based on the Template Method pattern and lets the caller of the JdbcTemplate specifying how the resultSet should be handled, while dealing with Connection, Statement, Query execution and Exception management. In other words, it reduces the boiler plate code a developer usually writes when dealing with JDBC code.

## What is a callback? What are the JdbcTemplate callback interfaces that can be used with queries? What is each used for? (You would not have to remember the interface names in the exam, but you should know what they do if you see them in a code sample).

A callback is a method (i.e a Functional Interface in Java) passed into a method parameter to be called by the skeleton that handles business specific logic. You hear a lot about Callbacks in Javascript. 

JdbcTemplate defines 3 callback interfaces:
* `RowMapper`: map a single resultSet line to a single Java Object. JdbcTemplate is iterating over the resultSet and calls the RowMapper at each iteration.  You can use a lambda to simplify your code.
```java
public class MemberRepository {
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public MemberRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    public List<Member> getMembersUsingARowMapper() {
        return jdbcTemplate.query("select * from members", (resultSet, i) -> toMembers(resultSet));
    }

    private Member toMembers(ResultSet resultSet) throws SQLException {
        return new Member(resultSet.getString("name"));
    }
}
```
* `ResultSetExtractor`: map multiple resultSet line to a single Java Object. JdbcTemplate lets you the responsibility to iterate over the ResultSet. You have more code to write comparing to RowMapper.
```java
public class OrderRepository {
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public OrderRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    public Order findOrderByIdUsingResultSetExtractor(String id) {
        return jdbcTemplate.query("select * from orders o join items i on o.id = i.order_id where o.id=?", this::toOrder, id);
    }

    private Order toOrder(ResultSet resultSet) throws SQLException {
        Order order = null;
        while(resultSet != null) {
            if(order == null) {
                order = new Order(resultSet.getString("id"));
            }
            order.add(new Item(resultSet.getString("name")));
        }
        return order;
    }
}
```
* `RowCallbackHandler`: executes code for each row without returning any value. You can use it for simple log use case, or building XML document representing your data without accumulating everything in memory.
```java
public class MemberRepository {
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public MemberRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    public void logMembersUsingRowCallbackHandler() {
        jdbcTemplate.query("select * from members", (resultSet) -> {
            System.out.println(resultSet.getString("name"));
        });
    }
}
```

## Can you execute a plain SQL statement with the JDBC template?

Of course, that is the purpose of JdbcTemplate. You can retrieve primitive data easily like:
```java
jdbcTemplate.queryForObject("select cunt(*) from members", Integer.class);
jdbcTemplate.queryForObject("select creationDate from members where id=?", Date.class, id);
```

## When does the JDBC template acquire (and release) a connection, for every method called or once per template? Why?

JdbcTemplate acquires and releases connection for every method called if you do not use Transaction (see below). Simply because you do not let a connection open once you are done using it. That it is not the role of JdbcTemplate to manage connection lifecycle but the role of a Transaction.

## How does the JdbcTemplate support queries? How does it return objects and lists/maps of objects?

JdbcTemplate provides generic method to retrieve objects easily without mapping them into a concrete Java object. You can use:
 * `queryForMap` to retrieve a single resultSet line into a Java `Map<String, Object>`
 * `queryForList` to retrieve a list of resultSet line into a Java `List<Map<String, Object>>`

## What is a transaction? What is the difference between a local and a global transaction?

A transaction is a set of tasks which take place as a single, indivisible actions. In Relational databases, transactions are ACID:
* **Atomicity**: Either commit all, or nothing.
* **Consistent**: Never violates the database integrity.
* **Isolated**: Keep concurrent modification separated from each other.
* **Durable**: Committed changes are permanent. 

A transaction is mostly here to make sure you do not use a partially modified aggregates in another business process. 

The difference between Local and Global Transactions:
* Local: The transaction is only linked to a single Datasource, where handing commit is easy. Belongs the package `javax.persistence.api`.
* Global: The transactions is distributed across multiple DataSources, where synchronization mechanisms like `2 phases commit` are necessary to ensure the global success of the atomic distributed operation. Belongs to the package `javax.transactions.api`.

## Is a transaction a cross cutting concern? How is it implemented by Spring?

A Transaction is a typical cross-cutting concern. If not handled properly, you end up duplicating the same code across your code base to handle transactions.

Spring implements the Transaction using a `@Around` advice (remember the AOP part?) where the target method is intercepted and the advice starts the Transactional behavior, ensuring the connection is properly created, committed, rolled-back and finally released.

Besides, Spring separates the transaction demarcation (where you want the transaction to start and end) from the implementation (wha transaction mechanisms you want to use).
* For Transaction demarcation: see below
* For Transaction implementation: Spring provides a top-level interface `PlatformTransactionManager`. Then, each transaction technology have to implements this interface and provides its specific behavior. This facilitates when you want to change from local transaction to global. You just have to modify the implementation, but you do not change the demarcation. Once again, it is easy to change the implementation details without changing the business code. 

## How are you going to define a transaction in Spring?

With Spring, you can define a Transaction in 2 ways:
* Programmatic: use a `TransactionTemplate`, based on the same Template Method pattern as `JdbcTemplate`, to let you pass the code you want to execute in a Transaction.
* Declarative: Use `@Transactional` annotation on a method or service class to let the `@Around` advice managing the transaction for you.

In both cases, Spring expects a bean `PlatformTransactionManager` to be in the Application Context. You can easily implement a `DatasourceTransactionManager` when dealing with a single Datasource in your code. 

```java
@Configuration
@EnableTransactionManagement
public class DataConfiguration {

    @Bean
    public DataSource dataSource() {
        return new EmbeddedDatabaseBuilder().build();
    }

    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    @Bean
    public MemberRepository memberRepository(DataSource dataSource) {
        return new MemberRepository(dataSource);
    }

    @Bean
    public OrderRepository orderRepository(DataSource dataSource) {
        return new OrderRepository(dataSource);
    }

    @Bean
    public ShoppingCartService service(OrderRepository orderRepository, MemberRepository memberRepository) {
        return new ShoppingCartService(orderRepository, memberRepository);
    }
}

public class ShoppingCartService {

    private final OrderRepository orderRepository;
    private final MemberRepository memberRepository;
    private TransactionTemplate transactionTemplate;

    public ShoppingCartService(OrderRepository orderRepository, MemberRepository memberRepository) {
        this.orderRepository = orderRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public void defaultDeclarativeTransactionOnMethod() {
        // execute your business logic here
    }

    public void programmaticTransactionOnMethod() {
        transactionTemplate.executeWithoutResult(status -> {
            // execute your business logic here
        });

    }

    public void setTransactionTemplate(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
    }
}
```

In the example above, both methods will have the same transactional behavior.

### What does @Transactional do? What is the PlatformTransactionManager?
See answer above.

## Is the JDBC template able to participate in an existing transaction?

Yes, JdbcTemplate is able to participate in a Transaction. It uses a `DatasourceUtils.getConnection()` to get the current connection. To do so, Spring uses the `ThreadLocalContext` in order to pass data from one class to another, like the current Database connection.

```java
// from org.springframework.jdbc.core.JdbcTemplate code
Connection con = DataSourceUtils.getConnection(obtainDataSource());
DataSourceUtils.releaseConnection(con, obtainDataSource());
```

## What is @EnableTransactionManagement for?

It enables a new `BeanPostProcessor` during the Application Context creation to add the Transactional behavior using AOP to the specified method/service.

```java
@Configuration
@EnableTransactionManagement
public class DataConfiguration {
}
```

## How does transaction propagation work?

Transaction propagation allows to specify the behavior in case of a business logic having code in multiple services, and each service is annotated with `@Transactional`. There are 7 levels of propagation, but you only need to know 2 for the exam:
* **REQUIRED**: If there is a transaction use it, otherwise create a new one. In this propagation, the same transaction is reused across all the different transactional services. Note this is the default mode when nothing specified.
* **REQUIRES_NEW**: No matter what, you always create a new Transaction.

Understanding propagation is key... If you have a method that fails, is it the entire logic that must fails and rollback, or is it just this specific part ? 

```java
public class MemberService {
    private final ShoppingCartService shoppingCartService;

    public MemberService(ShoppingCartService shoppingCartService) {
        this.shoppingCartService = shoppingCartService;
    }

    @Transactional
    public void defaultRequiredPropagation() {
        shoppingCartService.useSameTransactionAsCallerWithRequired();
    }

    @Transactional
    public void differentTransaction() {
        shoppingCartService.createNewTransactionWithRequiresNew();
    }
}

public class ShoppingCartService {

    @Transactional
    public void useSameTransactionAsCallerWithRequired() {

    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNewTransactionWithRequiresNew() {
        // This transaction will be different than the one created in MemberService
    }
}
```

## What happens if one @Transactional annotated method is calling another @Transactional annotated method inside a same object instance?

To understand the answer, you need to be comfortable with proxies. The proxy is called only when there is a call to the target method from the outside. Once you are in your object, the proxy will no longer be called. So, calling a  

```java
public class MemberService {
    @Transactional
    public void internalCall() {
        this.doesNotChangeCurrentTransaction();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void doesNotChangeCurrentTransaction() {
    }
}
```
## Where can the @Transactional annotation be used? What is a typical usage if you put it at class level?

`@Transactional` annotations are usually used in the Service layer. Indeed, a business logic can use multiple repositories to perform a single use case.
  
You use `@Transactional` on a method or a class. Typical class level usage are when you want to specify a default behavior, like `timeout` for instance. 

```java
public class MemberService {
    @Transactional
    public void internalCall() {
        this.doesNotChangeCurrentTransaction();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void doesNotChangeCurrentTransaction() {
    }
}
```
## What does declarative transaction management mean?

It means you will be using AOP to enhance your service method at runtime to add the Transactional behavior.

## What is the default rollback policy? How can you override it?

The default rollback policy is to rollback when the Advice receives a `RuntimeException`. You can override it by specifying the attribute `rollbackFor` and `noRollbackFor` of the Spring `@Transactional` annotation.

```java
public class MemberService {
    @Transactional
    public void defaultRollbackForRuntimeException() {

    }

    @Transactional(rollbackFor = NullPointerException.class, noRollbackFor = IllegalArgumentException.class)
    public void overrideDefaultRollbackFor() {
        
    }
}
```

## What is the default rollback policy in a JUnit test, when you use the @ RunWith(SpringJUnit4ClassRunner.class) in JUnit 4 or @ExtendWith(SpringExtension. class) in JUnit 5, and annotate your @Test annotated method with @Transactional?

In a Test environment, the default rollback policy is to always rollback, unless stated otherwise with `@Commit`.

```java
@SpringJUnitConfig
class MemberServiceTest {

    @Test
    @Transactional
    void transactionalTestRollbackAtTheEnd() {
    }
    
    @Test
    @Transactional
    @Commit
    void transactionalTestIsCommit() {
    }
}
```

> You can make all your test method transactional by annotating your class

```java
@SpringJUnitConfig
@Transactional
class MemberServiceTransactionalTest {

    @Test
    void transactionalTestRollbackAtTheEnd() {
    }

    @Test
    @Commit
    void transactionalTestIsCommit() {
    }
}
```

## Are you able to participate in a given transaction in Spring while working with JPA?

Yes, you can participate into an existing Transaction, even when using JPA.

## Which PlatformTransactionManager(s) can you use with JPA?

With JPA, you can use a `JpaTransactionManager`, that requires an `LocalEntityManagerFactoryBean` as parameter.

## What do you have to configure to use JPA with Spring? How does Spring Boot make this easier?

To have JPA working with Spring, you need:
* a `Datasource`, pretty obvious.
* a `LocalContainerEntityManagerFactoryBean` with a `HibernateVendorAdapter` to configure Hibernate to interpret your entities

```java
@Configuration
public class JpaDataConfiguration {

    @Bean
    public DataSource dataSource() {
        return new EmbeddedDatabaseBuilder().build();
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactoryBean(DataSource dataSource) {

        // Configure Hibernate
        HibernateJpaVendorAdapter adapter = new HibernateJpaVendorAdapter();
        adapter.setShowSql(true);
        adapter.setGenerateDdl(true);
        adapter.setDatabase(Database.HSQL);

        LocalContainerEntityManagerFactoryBean emfb = new LocalContainerEntityManagerFactoryBean();
        emfb.setDataSource(dataSource);
        emfb.setPackagesToScan("dev.truaro.blog.springcore.datamanagement.model");
        emfb.setJpaVendorAdapter(adapter);

        return emfb;
    }

    @Bean
    public PlatformTransactionManager platformTransactionManager(EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
```

Hopefully, with Spring Boot, it is way easier. Simply use:
* `@EntityScan("dev.truaro.blog.springcore.datamanagement.model")` at a class level to look up for your entities in the proper package.
* A lot of properties to configure `showSql` and `generateDdl` and even
* And lots of default configuration
```properties
# Hibernate will automatically determine the dialect
spring.jpa.database=default
# Generate the DDL ?
# Options: validate | update | create | create-drop
spring.jpa.hibernate.ddl-auto=update
# Show SQL being run (nicely formatted)
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
# Any hibernate property 'xxx'
spring.jpa.properties.hibernate.xxx=???
```

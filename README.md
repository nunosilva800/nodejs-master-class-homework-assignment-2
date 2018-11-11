# Node.js Master Class - homework assignment #2

This repo contains the code for homework assignment #2 of [The Node.js Master Class](https://pirple.thinkific.com/courses/the-nodejs-master-class).

## The Assignment:

You are building the API for a pizza-delivery company. Don't worry about a frontend, just build the API. Here's the spec from your project manager: 

1. New users can be created, their information can be edited, and they can be deleted. We should store their name, email address, and street address.

2. Users can log in and log out by creating or destroying a token.

3. When a user is logged in, they should be able to GET all the possible menu items (these items can be hardcoded into the system). 

4. A logged-in user should be able to fill a shopping cart with menu items

5. A logged-in user should be able to create an order. You should integrate with the Sandbox of Stripe.com to accept their payment. Note: Use the stripe sandbox for your testing. Follow this link and click on the "tokens" tab to see the fake tokens you can use server-side to confirm the integration is working: https://stripe.com/docs/testing#cards

6. When an order is placed, you should email the user a receipt. You should integrate with the sandbox of Mailgun.com for this. Note: Every Mailgun account comes with a sandbox email account domain (whatever@sandbox123.mailgun.org) that you can send from by default. So, there's no need to setup any DNS for your domain for this task https://documentation.mailgun.com/en/latest/faqs.html#how-do-i-pick-a-domain-name-for-my-mailgun-account

This is an open-ended assignment. You may take any direction you'd like to go with it, as long as your project includes the requirements. It can include anything else you wish as well. 


## API Usage

Ensure you have node 8+ installed, and run: 

```
$ NODE_DEBUG=server,stripe,worker node index.js
```

Import `postman_collection.json` into Postman to ease API testing.

### Ping
Check API status with:

```
$ curl localhost:3000/ping
```


### Users

#### Create user
Required fields: 
- name: string
- email: string
- address: string
- password: string
- tosAgreement: boolean

```
$ curl POST /users
```

#### Read user 
Required fields: 
- email: string

Requires `token` header for authentication. 

```
$ curl GET /users/:email
```

#### Update user
Required fields: 
- email: string

Optional fields (at least one is required):
- name: string
- address: string
- password: string

Requires `token` header for authentication.

```
$ curl PUT /users/:email
```

#### Destroy user
Required fields: 
- email: string

Requires `token` header for authentication.

```
$ curl DELETE /users/:email
```


### Access Tokens

Required fields: 
- email: string
- password: string

#### Create token
```
$ curl POST /tokens
```

Required fields: 
- id: string

#### Read token 
```
$ curl GET /tokens/:id
```

Required fields: 
- id: string
- extend: boolean

#### Update token
```
$ curl PUT /tokens/:id
```

Required fields: 
- id: string

#### Destroy token
```
$ curl DELETE /tokens/:id
```


### Menu

#### List menu items

Requires `token` header for authentication.

```
$ curl Get /menu
```


### Shopping Cart
Each user has only one cart. A cart may contain any number of menu items.

#### Read cart 

Requires `token` header for authentication.

```
$ curl GET /cart
```

#### Update cart

Adds or substracts menu items from cart. 
Positive values of quantity increment, negative values decrement.

Required fields: 
- menu_item_id: string
- quantity: integer

Requires `token` header for authentication.

```
$ curl PUT /cart
```

#### Destroy cart

Empties the cart or a single item

Optional fields: 
- menu_item_id: string

Requires `token` header for authentication.

```
$ curl DELETE /cart?menu_item_id
```


### Orders

#### Create order
Creates an order based on the current cart.

Required fields: 
- card_number: string
- card_exp_month: string
- card_exp_year: string
- card_cvc: string

Requires `token` header for authentication.

```
$ curl POST /orders
```

#### Read order 

Required fields: 
- id: string

Requires `token` header for authentication.

```
$ curl GET /orders?:id
```


### Note on HTTPS

HTTPS is disabled by default.
To use HTTPS, update the add your certificate and private key files to the project and update `config.js`.


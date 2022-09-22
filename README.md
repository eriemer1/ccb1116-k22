# ccb1116-k22 Integrations for Fun & Profit
Supplemental materials for K22 session ([YouTube Link](https://www.youtube.com/watch?v=7M2hZvw5AJQ) | [K22 Link](https://knowledge.servicenow.com/lasvegas/sessiondetail?sessionId=1652809842881001NXoe) (may require registration))

Questions? Comments? Want to talk some more? I am @eric on [SNDevs Slack](http://sndevs.com)

See code_sample folder for code samples and an update set.

Additional Resources:

- [Developer OOB REST API docs](https://developer.servicenow.com/dev.do#!/reference/api/sandiego/rest)
- [Developer SRAPI docs](https://developer.servicenow.com/dev.do#!/reference/api/sandiego/server/sn_ws-namespace)
- [Product Docs on IH API trigger](https://docs.servicenow.com/bundle/sandiego-application-development/page/administer/integrationhub/concept/rest-trigger.html)
- [Product Docs SRAPI Examples](https://docs.servicenow.com/bundle/sandiego-application-development/page/integrate/custom-web-services/concept/c_ScriptedRESTAPIExamples.html)
- [Learn Integrations on the Now Platform YouTube Playlist](https://www.youtube.com/playlist?list=PL3rNcyAiDYK0at2ypM6uhp_Mg6-gZlIdP)
- [Recordless Rest Is Great by Jace Benson](https://jace.pro/post/2019-09-14-recordless-rest-is-great/)


# Additional thoughts on Inbound REST

Hopefully you have already watched or attended my session, I want to expand on something I briefly talked about.

When you have an inbound endpoint I mentioned three buckets that they fall into. SRAPI, OOB, and Flow. I would like to explain why I ranked them in the order that I did.

I put the Flow trigger last. When I started on my presentation I was actually intending to put it first, and then I ran into an issue. The only response that you ever get from it is the Execution ID. Which is the sys_id of the execution record. In my opinion that makes this basically useless.

Here is why: There are basically 4 buckets that REST calls fall into. GET records, Insert (POST) records, update (PATCH and PUT) records, and delete (DELETE) records. 

#### With the Async Flow trigger here is what would happen with each of them:

######  GET

    Me: "I would like this record <sys_id>"

    SN: "Here is a different sysID"
  
######  Insert
    
    Me: "Please insert a record with this information"
    
    SN: "Here is a sys_id, but not the one of the record you created. If there are any issues due to Data policies, Business Rules, etc. I will just silently fail."
  
######  Update
    
    Me: "Please update the record <sys_id> with this information"
    
    SN: "Here is a sys_id. If there are any issues due to Data policies, Business Rules, etc. I will just silently fail."
  
######  Delete (there should be a really good reason for deleting something)
    
    Me: "Delete the record <sys_id>"
    
    SN: "Here is a sys_id, if the delete fails you won't know"
    
    
In my opinion this is pretty obviously a problem. There isnt even a way to do some basic input validation and send back a message of success or failure (or any HTTP codes, it will always have a 200 and the Execution ID)

#### OOB APIs

These are generally great, but there are caveats that need to be kept in mind.

1. They generally depend on the person writing the API call have an understanding of the ServiceNow database structure and how to interact with various fields. To me, this means that they are wonderful APIs for a SN developer to use, but it just makes life harder for a dev that knows nothing of SN. 
2. Security becomes more difficult. You either need to create a new role, and then add ACLs to every table/field that they will need access to, or give them an existing Role that may have far more access than they need.
  
  If these weren't bad enough, you also give up significan't control over how much they can hit the system or what they can grab. I have run into this in the past. I had to deal with both password sharing, and expantion of use cases. In one case, an integration went from querying the CMDB a few times a day for something specific, to being embedded in an app that thousands of users were using. This had the result of one of our CMDB tables getting queried many times per second. To make things even worse they were querying every field on every record of one of the CMDB tables and not caching anything (the client software literally parsed out a single data point and discarded the rest). After they deployed that application it crashed Prod.

3. No way to rate limit. ServiceNow allows us to rate limit APIs, which solves a lot of abuse issues, but it is very hard to limit APIs that get used internally. For example there are oob ServicePortal widgets that use the Table API (there used to be anyway. I think that all the ones that were got updated). Rate limiting would potentially break things.

#### Scripted REST APIs

This brings us to my favorite, the SRAPI.

I think that this solves all of the issues I outlined above.

1. Unlike the Async Flow trigger you can define the exact return payload, in the format that the 3rd party wants it in. You can also do validation and return useful error messages.
2. There is no need for the 3rd party to have any understanding of the ServiceNow database or table structure. You can define the endpoint to only require the bare minimum information that you need for that specific use. For example, if they will only need information from one table, there is no need to ask them what table. There is also no need to ask them what information should be returned because it is defined already.
3. Security is far simpler. Instead of messing with ACLs on various tables and fields, the SRAPI itself has an ACL that it uses to decide if the user calling it has appropriate access or not. This means that you do not need to open any additional access to any tables or fields.
4. Rate limiting is possible. Once you define your ACL you can have a rate limit that applys only to it, or is even focused on specific users/roles calling it.

In fairness there are downsides. You do need to do some development work, but as you saw in my session it isnt too bad. You also need to document your API both internally and externally. Internally so that there is an understanding of what that API is doing and why. Externally so that the 3rd party knows how to call the API and what the response will look like (as well as information about any errors that they can expect). In my opinion this is a very fair tradeoff. Even more so since the documentation is typically quite brief, the API call is as simple as makes sense because it is specifically fit for purpose, the response is straightforward, and you should know the error conditions because you wrote them out in your script.

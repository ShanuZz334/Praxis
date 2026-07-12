Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK










































Developer API
Getting Started
API Structure
Request Structure
On this page
Request Structure
Request format
Use the following structure to make requests to the Upstox API:
curl --request [API_METHOD] \
  --url 'https://api.upstox.com/[API_VERSION]/[API_ENDPOINT]' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
  [CONTENT_TYPE_HEADER] \
  [REQUEST_PAYLOAD]
Placeholders
URL encoding
URL encoding requirement
All API requests must be encoded using the Standard URL Encoding - Encodes special characters and non-ASCII characters using the percent sign and two hexadecimal digits.

Previous
API Structure

Next
Response Structure

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK










































Developer API
Getting Started
API Structure
Response Structure
On this page
Response Structure
Success response
Single Object Response Structure
Used for endpoints that return a single object, like /order/place and /user/profile.
{
    "status": "success",
    "data": {
      "key1": "value1",
      "key2": "value2",
      ...
    }
}
Multiple Object Response Structure
Used for endpoints that return a multiple object, like /user/get-funds-and-margin
{
    "status": "success",
    "data": [
      {
        "key1": "value1",
        "key2": "value2",
        ...
      },
      {
        "key1": "value1",
        "key2": "value2",
        ...
      }
    ]
}  
Properties:
Error response
{
  "status": "error",
  "errors": [
    {
      "error_code": "string",
      "message": "string",
      "property_path": null,
      "invalid_value": null
    }
  ]
}
Properties:
Notice of Deprecation
The camelCase fields (errorCode, propertyPath, and invalidValue) are deprecated and will be removed in future versions. Use the snake_case versions for consistency.

Previous
Request Structure

Next
Error Codes

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK










































Developer API
Getting Started
API Structure
Error Codes
On this page
Error Codes
HTTP error codes


Common API error codes
Error codes specific to each API are detailed in the 4XX response section within their respective documentation.

Previous
Response Structure

Next
Rate Limits

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK










































Developer API
Getting Started
Rate Limits
On this page
Rate Limits
In our pursuit of offering a consistent and reliable service, we've established rate limits for our API interactions. These constraints, detailed below, are designed to prevent system overloads and ensure equitable access to all our users. The rate limits are enforced on a per-API, per-user basis.
As per the circular dated May 5, 2025, rate limiting for retail investors participating in Algo trading has been classified into two categories.
Combined rate limiting for Order Placement APIs
(Place, Modify, Cancel, Multi Order and GTT Order)
Regular Algos -> No Algo Registration Needed
SEBI-Registered Algos -> Algo Registration Needed


Other Standard APIs
(holdings, positions, funds, historical candles etc.)
Payout APIs
Standard Access (Get Payouts, Get Payout Modes, Get Payins)
Restricted Access (Payout Request, Modify Payout, Cancel Payout)
Exceeding rate limits
Please adhere to these limits to avoid potential disruptions in service. Exceeding these limits might result in temporary suspension of access.

Previous
Error Codes

Next
Instrument APIs

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK












































Developer API
Getting Started
Instruments
Instrument files
On this page
Instruments
Available instrument files
The BOD Instruments section provides a list of all instruments available at the beginning of the day.
The Mutual fund instruments section provides the mutual fund scheme master in JSON format.
The MTF Instruments section provides the list of MTF instruments in JSON format.
The MIS Instruments section provides the list of MIS instruments in JSON format.
The Suspended instruments section provides the list of Suspended instruments in JSON format.
The Global Instruments section provides the global market indices and indicators in JSON format.
Recommendations
Use instrument_key for uniquely identifying instruments, as it remains unique for each instrument. Conversely, exchange_token may be reused by the exchange for a different instrument after its expiry.
Use Instruments data in JSON format instead of CSV, as its structure has been designed for enhanced robustness and future scalability, making programmatic processing easier.
JSON files
These URLs provide access to the complete list of BOD contracts available for trading on Upstox in JSON format.
Complete
NSE
BSE
MCX
Mutual fund instruments
This URL provides access to the list of mutual fund instruments available for trading on Upstox.
Mutual fund instruments
Suspended Instruments
This URL provides access to the list of suspended instruments that are not available for trading on Upstox.
Suspended
MTF Instruments
This URL provides access to the list of instruments that are available for Margin Trading Facility (MTF) on Upstox.
MTF
MIS Instruments
This URL provides access to the list of instruments that are available for Margin Intraday Square-off (MIS) on Upstox.
NSE
BSE
Global Instruments
This URL provides access to the list of global market indices and economic indicators available on Upstox. Use the instrument_key values from this file with the Market Quote and Historical Data APIs.
Global
Sample JSON Object
Included in the BOD file
The first four tabs (EQ, Futures, Options, and Index) are all included in the BOD json file.
EQ
Futures
Options
INDEX
Suspended
MTF
MIS
MF
Global
{
  "segment": "NSE_EQ",
  "name": "JOCIL LIMITED",
  "exchange": "NSE",
  "isin": "INE839G01010",
  "instrument_type": "EQ",
  "instrument_key": "NSE_EQ|INE839G01010",
  "lot_size": 1,
  "freeze_quantity": 100000.0,
  "exchange_token": "16927",
  "tick_size": 5.0,
  "trading_symbol": "JOCIL",
  "short_name": "JOCIL",
  "security_type": "NORMAL"
}
Filtering by segment and type
When you're searching for instrument keys within an instrument JSON file, you can employ the segment and instrument_type parameters to refine and narrow down the list of instrument keys. For instance, if you're looking for the instrument key for Reliance Equity, specify the segment as NSE_EQ and the instrument_type as EQ, excluding other segments and instrument types from your search criteria.
Field Description
File refresh schedule
The files undergo daily refresh at around 6 AM, and they are only refreshed as needed during the day, which is a seldom occurrence.
The BOD instrument for the next trading day will not include delisted stocks or expired contracts.
Deprecation Notice
The CSV format for instruments files is being deprecated. Switch to the JSON format for improved performance. Details at CSV Instruments File Deprecation Notice.
CSV Files Deprecated
These URLs provide access to the complete list of BOD contracts available for trading on Upstox in CSV format.
Complete
NSE
BSE
MCX
Sample CSV Record
Field Description

Previous
Instrument APIs

Next
Instrument Search

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK












































Developer API
Getting Started
Instruments
Instrument Search
On this page
GET
/instruments/search
Instrument Search
API to find instruments by name, symbol, or contract details. You can search across exchanges and filter by segment, instrument type, expiry, and ATM offset. Results are paginated.

When you do not need the full downloadable file, you can use this API instead of the Instrument JSON files. The response structure matches the BOD JSON instruments.
Key features
Free text — Search by symbol name, strike price, or instrument type. The search is case-insensitive and supports partial matches on symbol, name, and short name.
ISIN search — Pass an ISIN directly as the query value to retrieve all exchange listings for that security. For example, query=INE002A01018 returns both the NSE and BSE equity entries for Reliance Industries. This is useful when you have an ISIN from a portfolio or holdings feed.
Exchange and segment filters — Narrow results to specific exchanges (NSE, BSE, MCX) and segments (EQ, FO, CURR, COMM, etc.).
Expiry filters — Filter derivatives by expiry using keywords or specific dates:
ATM offset — Find options at or near the at-the-money strike. Set atm_offset=0 for ATM, positive values for strikes above, and negative values for strikes below.
Pagination — Control page size (max 30 records) and navigate through results.
ATM search example
Suppose Nifty is at 24,500 and the strike interval is 50:
To run this search, set query=NIFTY, instrument_types=CE (or PE), and an expiry value like current_week. If you omit expiry, the search defaults to current week options.
Search tips
Queries that may return unexpected results
Single characters or digits (e.g. 1, A) — too broad. Add exchange or segment filters to narrow results.
Strike price only (e.g. 24000) — matches many contracts across underlyings. Include the symbol (e.g. NIFTY 24000).
Multiple symbols (e.g. RELIANCE NIFTY) — not interpreted as two separate searches. Search one symbol per request.
Exchange token — not searchable via query. Use the Instruments JSON files to look up by exchange token.
Special characters — may not improve matching. Use alphanumeric characters and spaces only.
Reliable pattern: short symbol (RELIANCE, NIFTY) + filters (expiry, instrument_types, atm_offset when needed).
Do not include spaces between values in comma-separated lists (e.g. NSE,BSE not NSE, BSE).
Use specific filters (exchanges, segments, expiry) alongside query for faster, more accurate results.
Request
curl --location 'https://api.upstox.com/v2/instruments/search?query=Reliance&expiry=current_month&atm_offset=0&page_number=1&records=20' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For code samples in Python, Node.js, Java, and PHP, see the Sample Code section below.
Query Parameters
Responses
200
4XX
Response Body
Successful responses include status, a data array of instruments, and meta_data.page for pagination. The fields on each item in data depend on segment (EQ, F&O, INDEX).
EQ
Futures
Options
INDEX
{
    "status": "success",
    "data": [
        {
            "name": "RELIANCE INDUSTRIES LTD",
            "segment": "NSE_EQ",
            "exchange": "NSE",
            "isin": "INE002A01018",
            "instrument_key": "NSE_EQ|INE002A01018",
            "exchange_token": "2885",
            "trading_symbol": "RELIANCE",
            "short_name": "Reliance",
            "tick_size": 10.0,
            "lot_size": 1,
            "instrument_type": "EQ",
            "freeze_quantity": 100000.0,
            "qty_multiplier": 1,
            "security_type": "NORMAL"
        },
        {
            "name": "RELIANCE INDUSTRIES LTD.",
            "segment": "BSE_EQ",
            "exchange": "BSE",
            "isin": "INE002A01018",
            "instrument_key": "BSE_EQ|INE002A01018",
            "exchange_token": "500325",
            "trading_symbol": "RELIANCE",
            "short_name": "RELIANCE",
            "tick_size": 5.0,
            "lot_size": 1,
            "instrument_type": "A",
            "freeze_quantity": 100000.0,
            "qty_multiplier": 1
        }
    ],
    "meta_data": {
        "page": {
            "page_number": 1,
            "total_pages": 1,
            "records": 20,
            "total_records": 2
        }
    }
}
Sample Code
cURL
Python
Node.js
Java
PHP
curl --location 'https://api.upstox.com/v2/instruments/search?query=RELIANCE&exchanges=NSE&segments=FO&instrument_types=CE,PE&expiry=current_month&atm_offset=0&page_number=1&records=20' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Instrument files

Next
Authentication

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK












































Developer API
Getting Started
Authentication
On this page
Authentication
Upstox uses the standard OAuth 2.0 authorization code flow to log customers in and issue access tokens. Your application never handles Upstox credentials directly — the customer signs in on Upstox, and your app receives an access token to call the API on their behalf.
Upstox APIYour serverUpstox loginYour appUpstox APIYour serverUpstox loginYour appCustomer logs in(TOTP / OTP)302 redirectclient_id,redirect_uri,response_type1redirect with?code=<auth_code>2POST token requestcode, client_id,client_secret,redirect_uri,grant_type3access_token4access_token5
In short: your app sends the customer to Upstox, the customer logs in, Upstox returns a single-use authorization code, your server exchanges that code for an access_token, and your app uses the token to call the API. The steps below walk through each stage.
All logins are handled by upstox.com. There is no public endpoint for other applications to directly log the customer into their upstox.com. For security and compliance purposes, all logins and logouts are handled exclusively by upstox.com.
Before you begin
To complete the flow, create an app on Upstox Developer Apps. From it you will need:
The API key (client_id) and API secret (client_secret).
A registered redirect URI that exactly matches the one you send in Step 1.
OAuth terminology
In OAuth, client_id is your API Key (not the customer's UCC) and client_secret is your API Secret.
Step 1: Redirect the customer to the Upstox login
Open the Upstox login page in a Webview (or similar) and pass the parameters below as query parameters:
https://api.upstox.com/v2/login/authorization/dialog
URL construction:
https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=<Your-API-Key-Here>&redirect_uri=<Your-Redirect-URI-Here>&state=<Your-Optional-State-Parameter-Here>
Sample URL:
https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=615b1297-d443-3b39-ba19-1927fbcdddc7&redirect_uri=https%3A%2F%2Fwww.trading.tech%2Flogin%2Fupstox-v2&state=RnJpIERlYyAxNiAyMDIyIDE1OjU4OjUxIEdNVCswNTMwIChJbmRpYSBTdGFuZGFyZCBUaW1lKQ%3D%3D
Redirect URL and credential errors
Redirect URLs ending in .php or similar extensions may be blocked for security reasons. Avoid placing the redirect at the end of the URL — position it somewhere in the middle instead.
An Invalid Credentials error usually means the request parameters (client_id, redirect_uri, and response_type) do not match the values registered during app creation. Verify these and correct any discrepancies before retrying.
The customer is then taken to the Upstox login page to sign in.

TOTP for safer login
Customers can choose TOTP (Time-based One-Time Password) instead of SMS OTP for 2FA — a more secure method for a safer login. Learn how to activate TOTP on an Upstox account here.
Step 2: Receive the authorization code
After a successful login, Upstox redirects to the redirect_uri you provided, with the code needed for token generation included as a query parameter:
https://<redirect_uri>?code=mk404x&state=XX56849
Step 3: Exchange the code for an access token
Make a server-to-server POST call from your backend to exchange the authorization code for an access_token:
https://api.upstox.com/v2/login/authorization/token
Single-use authorization code
The authorization code is valid for a single use, regardless of whether the access token generation succeeds or fails.
Pass the following parameters:
cURL
Python
Node.js
curl -X 'POST' 'https://api.upstox.com/v2/login/authorization/token' \
-H 'accept: application/json' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'code=<Your-Auth-Code-Here>&client_id=<Your-API-Key-Here>&client_secret=<Your-API-Secret-Here>&redirect_uri=<Your-Redirect-URI-Here>&grant_type=authorization_code'
The response returns an access_token, which your front-end application can use to call the Upstox API on the customer's behalf.
Other ways to generate a token
The authorization code flow above is the standard, interactive method. Two alternatives are available for apps that cannot run an interactive login each time:
Semi-automated token generation
For apps that automate authentication requests but require manual approval:
Configure your app to trigger the auth request at a specific time, as detailed in the Access Token Request API.
When notified on your mobile, approve the authentication by either:
Clicking the link in the notification, or
Visiting Upstox Developer Apps and approving the request.
Once approved, the access token is delivered to the notifier URL set during app creation.
Ensure your app listens on the notifier URL and stores the token for further use.
For more details on implementation and usage, see the Access Token Request Documentation.
Manual token generation
If your app is a small utility where manual input is feasible, you can generate an access token directly:
Visit Upstox Developer Apps and click the app you created.
Click Generate to create a new access token.
Copy the generated token and use it in your app.
This is ideal for one-time or occasional API usage where automation isn't required.

Previous
Instrument Search

Next
Login

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































Developer API
Getting Started
Login
Authorize
On this page
GET
/login/authorization/dialog
Authorize
The authorization flow initiates a redirection to the Upstox login page, with necessary information. Upon a successful user login, the user is then redirected to the specified "redirect_uri" with an authorization code. This code should be utilized in the subsequent step to acquire the access token in the get token API.
Query Parameters
Responses
302
4XX
Upon successful authentication, this API will redirect to the URL specified in the redirect_url parameter, with the code essential for the token generation included within the request parameters.
https://<redirect_uri>?code=mk404x&state=XX56849
NOTE
While creating app provide a redirect_uri which is in your control rather than a public endpoint.
Additionally, it's important to generate a random value for the state parameter and subsequently validate whether the value returned matches the one you originally sent. This helps ensure the security and integrity of your application.
The QR code login is not compatible with the login flow of the Upstox API.

Previous
Login

Next
Analytics Token

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































Developer API
Getting Started
Login
Analytics Token
On this page
Analytics Token
The Analytics Token is a long-lived access token (1-year validity) that provides read-only access to a defined set of Upstox APIs. Unlike the standard OAuth token flow, no authorization redirect is required — you generate it directly from the Developer Apps page. Because it is strictly read-only, the Analytics Token cannot be used for order placement, order modification, or any other trading operations.
Static IP requirement
To access Account, Funds and Portfolio specific APIs — such as profile, funds, orders, positions, and holdings etc. — Static IP should be enabled, and the API request must originate from the configured static IP address. Market data and other non-account APIs are accessible without it.
Supported APIs
Token Limitations and Restrictions
The Analytics Token does not support trading operations. Actions such as placing or modifying orders are not permitted with this token.
Each token has an expiry period of 1 year from the date of generation.
Only one Analytics Token is permitted per account at a time.
Do not share this token with anyone. Treat it as a sensitive credential and store it in a secure location.
As the token is strictly read-only, only GET APIs are supported within these categories.
Generate an Analytics Token
Visit the Developer Apps page — Go to the Upstox Developer Apps page and navigate to the Analytics tab.

Click Generate Token — Click the Generate Token button. A confirmation dialog will appear asking you to verify the action.

Confirm the generation — Click Confirm. The token is generated and displayed along with its Name, Token (truncated), Date Created, Expiry Date, and a Revoke button.

Copy the full token — Click the copy icon next to the truncated token to copy the full token value to your clipboard.


Previous
Authorize

Next
Get Token

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































Developer API
Getting Started
Login
Get Token
On this page
POST
/login/authorization/token
Get Token
API to acquire an access token via an authorization_code exchange and concurrently includes the user's profile in the response.
The access_token obtained through this API has a specific validity period that lasts until 3:30 AM the following day, regardless of the time it was generated. For instance, if you generate a token at 8 PM on Tuesday, it will expire at 3:30 AM on Wednesday. This also means that a token created at 2:30 AM on Wednesday will still expire at 3:30 AM on the same Wednesday. Therefore, users are advised to plan their activities accordingly, ensuring they accommodate the token's expiration schedule in their usage. The code sent as part of this request is valid for a single use, regardless of whether the access token generation succeeds or encounters an issue.
Request
curl -X 'POST' 'https://api.upstox.com/v2/login/authorization/token' \
-H 'accept: application/json' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'code={your_code}&client_id={your_client_id}&client_secret={your_client_secret}&redirect_uri={your_redirect_url}&grant_type=authorization_code'
For additional samples in various languages, please refer to the Sample code section on this page.
Request Body
Responses
200
4XX
Response Body
{
  "email": "******",
  "exchanges": ["NSE", "NFO", "BSE", "CDS", "BFO", "BCD"],
  "products": ["D", "CO", "I"],
  "broker": "UPSTOX",
  "user_id": "******",
  "user_name": "******",
  "order_types": ["MARKET", "LIMIT", "SL", "SL-M"],
  "user_type": "individual",
  "poa": false,
  "is_active": true,
  "access_token": "******************"
  "extended_token": "******************"
}


Sample Code
Get access token using auth code
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/login/authorization/token'
headers = {
    'accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
}

data = {
    'code': '{your_code}',
    'client_id': '{your_client_id}',
    'client_secret': '{your_client_secret}',
    'redirect_uri': '{your_redirect_url}',
    'grant_type': 'authorization_code',
}

response = requests.post(url, headers=headers, data=data)

print(response.status_code)
print(response.json())
NOTE
If a user attempting to log in has no active segments, the error No segments for these users are active. Manual reactivation is recommended from Upstox app/web. will occur, preventing the Token API from generating the access_token. To resolve this, users must manually reactivate their segment through the Upstox web or mobile application before attempting to log in again.

Previous
Analytics Token

Next
Access Token Request

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































Developer API
Getting Started
Login
Access Token Request
On this page
POST
/login/auth/token/request/:client_id
Access Token Request for User
The Access Token Request API is one of the vital component of the token generation workflow, designed to streamline the process of granting access to resources. It facilitates secure communication by triggering a user-driven approval process.
The following illustration depicts the flow and the actions performed by both the Initiator and the Account Holder.
Notifier webhookAccount holderUpstox APIInitiatorNotifier webhookAccount holderUpstox APIInitiatorRequest discarded —no token issuedalt[User approves][User rejects]POST token requestclient_id, client_secret1authorization_expiry,notifier_url2Request approval(In-App + WhatsApp)3Approve4POST access_tokento notifier_url5Reject6
Here's how the process works in detail:
Step 1: Initiating the Request
When the API is invoked, a request for an access token is generated. This triggers a notification to the user, informing them of the pending action required to either approve or reject the request.
Step 2: User Notification
The user is notified through multiple channels to ensure they are aware of the request. Notifications are sent via:
In-App (Upstox Mobile/Web): A prompt appears within the Upstox mobile or web platform.
WhatsApp: An additional notification is sent to the user's WhatsApp account for convenience.
These notifications provide the necessary details about the request, including the reason and origin, enabling the user to make an informed decision.
Step 3: User Action
The user can either approve or reject the request based on their discretion:
Approval: If the user approves the request, the access token is securely transmitted to the designated Notifier Webhook Endpoint, which was configured during the app setup process. This ensures that the token reaches the appropriate endpoint for further use.
Rejection: If the user rejects the request, the token generation process is terminated, and the request is discarded. No token is created or sent.
Note: It is crucial to distinguish this API from the standard token generation API, which is used for generating tokens independently by the Account Holder without external initiation.
Request
curl -X 'POST' 'https://api.upstox.com/v3/login/auth/token/request/678d46e1-91ac-4b8d-925d-89c8e3015c2b' \
-H 'accept: application/json' \
-H 'Content-Type: application/json' \
-d '{
  "client_secret": "{your_client_secret}"
}'
For additional samples in various languages, please refer to the Sample code section on this page.
Path Parameters
Request Body
Responses
200
4XX
Response Body
{
    "status": "success",
    "data": {
        "authorization_expiry": "1732226400000",
        "notifier_url": "https://initiator-webhook-endpoint"
    }
}


Notifier Webhook
Once the user approves the initiator's request to generate an access token, the Upstox API will send the following payload to the specified notifier webhook URL:
Response structure:

{
    "client_id": "615b1297-d443-3b39-ba19-1927fbcdddc7",
    "user_id": "******",
    "access_token": "*********",
    "token_type": "Bearer",
    "expires_at": "1731448800000",
    "issued_at": "1731412800000",
    "message_type": "access_token"
}
Authorization Expiry
The access token request to obtain the access_token has a defined validity period that expires at 3:30 AM the following day, unless the user approves it sooner.
For example:
If the initiator requests the token at 8:00 PM on Tuesday, the request will expire at 3:30 AM on Wednesday, at which point it will expire.
Similarly, if the request is initiated at 2:30 AM on Wednesday, it will still expire at 3:30 AM on the same Wednesday.
Users are encouraged to approve the access token request promptly, keeping the expiration schedule in mind to ensure smooth access and usage.
Sample Code
Access token request
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v3/login/auth/token/request/678d46e1-91ac-4b8d-925d-89c8e3015c2b'
headers = {
    'accept': 'application/json',
    'Content-Type': 'application/json',
}

data = {
    'client_secret': '{your_client_secret}'
}

response = requests.post(url, headers=headers, data=data)

print(response.status_code)
print(response.json())
Notifier Webhook Endpoint
The Notifier Webhook Endpoint is a designated URL that must be configured during the app generation process. This endpoint is a POST API hosted by the request initiators where our system will send the access_token. For details on the webhook payload, refer to the Notifier Webhook section for webhook payload.
For more details and comprehensive setup instructions, see the Notifier Webhook Endpoint section.
NOTE
In the Access Token Request, client_id means API Key (not customer UCC) and client_secret means API Secret.

Previous
Get Token

Next
Logout

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































Developer API
Getting Started
Login
Logout
On this page
DELETE
/logout
Logout
API to log out a user's active session, making the current session no longer valid. After logging out, the user will need to log in again for any further interactions.
Request
curl --location --request DELETE 'https://api.upstox.com/v2/logout' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
Response Body
{
  "status": "success",
  "data": true
}


Sample Code
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/logout'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.delete(url, headers=headers)

print(response.status_code)
print(response.json())

Previous
Access Token Request

Next
Sandbox

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































Developer API
Getting Started
Sandbox
On this page
Sandbox APIs
What is the Sandbox App?
To simplify the integration process for developers working with the Upstox APIs, we have developed a sandbox environment that closely emulates the actual API integration experience. This setup allows developers to fully integrate and test their applications end-to-end on the payload before even connecting to the live market. In the sandbox, you can test strategies and integrations comprehensively without incurring any costs and without any time restrictions, unlike the live system which operates only during defined periods.
In simple terms, using the sandbox APIs ensures that you have thoroughly tested all your code and its interactions within the API before executing actual orders in the live market.
We will be rolling out the sandbox feature in a phased manner, so it is advisable to check the documentation regularly for updates on the availability of additional sandbox APIs.
Create a Sandbox App and Generate a Token
Follow these steps to set up a sandbox app and generate an access token for API execution:
Access the Sandbox Section - Visit the Upstox Developer Apps page to view the sandbox section. Here, you can manage your app and token.

Start the App Creation Process - Click the New Sandbox App button to open the application form. This form will allow you to specify the details of your new sandbox app. Note that the redirect URL and postback URL fields are included to collect data and currently do not serve any functional purpose for the sandbox app. These fields are mandatory for the live app and will soon mimic their functionality in the sandbox environment as well. We recommend filling out these URLs now to avoid having to update this information when the feature is fully implemented in the sandbox.

Complete the App Form - Fill in the required fields in the form to define your sandbox app’s settings and features. After entering the information, click Continue to create your new sandbox app.

Generate Your Access Token - Navigate to your newly created sandbox app, and click the Generate button. This will create a new access token that you can use to authenticate API requests.

Copy Your Access Token - Once the token is generated, it will be displayed on the screen. Copy this token, which will be valid for 30 days, for use in your sandbox API executions.

Sandbox app and token limits
Only one sandbox app is permitted per user, ensuring focused and manageable testing environments.
Sandbox access tokens are exclusively for sandbox orders and cannot be used for live transactions.


Identifying APIs with Sandbox Capability
This section will guide you on how to identify APIs that have the sandbox feature enabled in the API documentation. As we progress towards making all APIs sandbox capable, the 'Sandbox enabled' flag will eventually be phased out. For now, here's how to spot and utilize APIs with sandbox capabilities from the documentation:
Look for the Sandbox Flag - An API with sandbox capabilities will display a 'Sandbox enabled' flag next to the page title.

Check the Request Setup - A section with request-related fields will be present, often pre-filled with a sample payload, if applicable. Enter your sandbox token, generated as described in the previous sections, and click the 'Send API Request' button to proceed.

Review the API Response - Once executed, the response section will appear, showing the data received from the API. This is how you can confirm that the sandbox API is functioning as expected.

Sandbox enabled APIs
To facilitate easy navigation, we have listed APIs with sandbox capabilities within our documentation or developer portal.
Place Order
Place Order V3
Place Multi Order
Modify Order
Modify Order V3
Cancel Order
Cancel Order V3

Previous
Logout

Next
SDK

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK





















































Developer API
Getting Started
SDK
What's an SDK?
On this page
What's an SDK?
An SDK (Software Development Kit) is a simplified set of tools, libraries, and best practices designed to help you access and use an API without needing deep technical expertise. Think of it as a ready-made toolkit where most of the heavy lifting is already handled for you. Instead of worrying about complex integrations and low-level details, you can simply follow the SDK’s methods and guidelines.
Why Use the Upstox SDK?
By using the Upstox SDK, you:
Eliminate Excess Complexity: No need to be a tech pro to integrate with Upstox. The SDK streamlines API calls so you can focus on leveraging the data rather than decoding technical specs.
Save Time and Effort: Common tasks like authentication, managing requests, and handling responses are built-in. You spend less time coding and more time on business logic.
Reduce Errors: Predefined functions and data structures help ensure you’re making valid calls, limiting the chance of mistakes.
Stay Current with Minimal Effort: As the Upstox team updates or improves the SDK, you just upgrade the library—no deep code changes needed.
Who Should Use an SDK
The Upstox SDK is best suited for developers or teams who want a quick, hassle-free way to integrate with Upstox, without needing in-depth technical knowledge. It’s especially useful for those who don’t require granular control over each API call and prefer a more guided approach—where common tasks such as authentication, error handling, and data formatting are already handled by the SDK. This makes it ideal for smaller projects, businesses with limited technical resources, and any scenario where simplicity and speed of implementation take priority.


Advantages Over Using the API Alone
Automatic Handling of Deprecations:
When a field is changed or deprecated in the API, the Upstox team updates the SDK accordingly.
You just upgrade to the latest version of the SDK, and your integration remains intact.
Without the SDK, you’d need to make potentially significant changes in your code whenever the API is updated.
Ongoing Performance Improvements:
Our team continually refines the SDK for efficiency and reliability.
By updating the SDK, you automatically benefit from these performance boosts.
Centralized Support and Documentation:
Having one comprehensive source for instructions, release notes, and troubleshooting tips helps you quickly find what you need.
Consolidated support makes it easier to resolve any issues, as the SDK is maintained by a dedicated team.
Overall, using the Upstox SDK means you can confidently build, maintain, and scale your application with minimal hassle—keeping your integration smooth and your focus on growing your business.

Previous
SDK

Next
Prerequisites

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK





















































Developer API
Getting Started
SDK
Prerequisites
On this page
Prerequisites
Before using the Upstox SDK, you need to complete two key steps:
1. Procuring API Credentials
To access the Upstox API, you must create an app and obtain an API Key and API Secret. Follow the instructions in the official Upstox documentation to create an app and retrieve your credentials:
🔗 Upstox API App Creation Guide
2. Setting Up Your Development Environment
Depending on your preferred programming language, follow the setup process below to prepare your environment for SDK integration.
Python Environment Setup
Install Python (if not installed) – Download and install from python.org.
Set up a Virtual Environment (Recommended):
python -m venv upstox_env
source upstox_env/bin/activate  # Mac/Linux
upstox_env\Scripts\activate     # Windows
Ensure pip is up to date:
python -m pip install --upgrade pip
Proceed to SDK installation in the next section
Node.js Environment Setup
Install Node.js – Download and install from nodejs.org.
Verify installation:
node -v
npm -v
Initialize a new Node.js project (optional but recommended):
mkdir upstox-sdk && cd upstox-sdk
npm init -y
Proceed to SDK installation in the next section
Java Environment Setup
Install Java (JDK 11 or later) – Download from Adoptium or Oracle.
Set up environment variables (if needed):
Add JAVA_HOME to your system variables
Ensure java and javac are accessible via CLI:
java -version
javac -version
Set up Maven or Gradle (Recommended for dependency management):
Maven Setup Guide
Gradle Setup Guide
Proceed to SDK installation in the next section
PHP Environment Setup
Install PHP – Download and install from php.net.
Verify PHP installation:
php -v
Install Composer (Dependency Manager for PHP):
Download and install from getcomposer.org.
Verify installation:
composer -v
Proceed to SDK installation in the next section
With your development environment set up, you’re now ready to install and integrate the Upstox SDK in your chosen language! 🚀

Previous
What's an SDK?

Next
Installing the Upstox SDK

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK





















































Developer API
Getting Started
SDK
Installing the Upstox SDK
On this page
Installing the Upstox SDK
With your environment set up, the next step is to install the Upstox SDK along with any required dependencies. Follow the instructions for your preferred language to ensure a smooth setup and integration.
Python
Repository Links:
GitHub: https://github.com/upstox/upstox-python
PIP: https://pypi.org/project/upstox-python-sdk/
Installation:
pip install --upgrade upstox-python-sdk


Node.js
Repository Links:
GitHub: https://github.com/upstox/upstox-nodejs
NPM: https://www.npmjs.com/package/upstox-js-sdk
Installation:
npm install upstox-js-sdk --save


Java
Repository Links:
GitHub: https://github.com/upstox/upstox-java
Maven Central: https://mvnrepository.com/artifact/com.upstox.api/upstox-java-sdk
Installation:
Maven – Add this to your pom.xml:
<dependency>
  <groupId>com.upstox.api</groupId>
  <artifactId>upstox-java-sdk</artifactId>
  <version>LATEST</version>
  <scope>compile</scope>
</dependency>
Gradle – Add this to your build.gradle:
implementation "com.upstox.api:upstox-java-sdk:+"


PHP
Repository Links:
GitHub: https://github.com/upstox/upstox-php
Composer: https://packagist.org/packages/upstox/upstox-php-sdk
Installation:
composer require upstox/upstox-php-sdk


.NET
Repository Links:
GitHub: https://github.com/upstox/upstox-dotnet
NuGet: https://www.nuget.org/packages/upstox-dotnet-sdk
Installation:
.NET CLI:
dotnet add package upstox-dotnet-sdk
Package Manager Console:
Install-Package upstox-dotnet-sdk

Previous
Prerequisites

Next
Build using Sandbox

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK





















































Developer API
Getting Started
SDK
Build using Sandbox
On this page
Building with Sandbox Mode
We recommend using Sandbox Mode for building and testing your apps, as it offers greater flexibility bypassing trading window limitations. This allows for seamless testing without real-market constraints.
🔗 Learn more about sandbox benefits: Sandbox Documentation
Steps to Use Sandbox Mode in the SDK
Step 1: Create a Sandbox Access Token
To use the sandbox environment, you must first create a sandbox app. If you haven’t created one yet, follow the instructions to set up your app and generate a sandbox access token.
🔗 Create a Sandbox App & Generate Token: Sandbox Access Token Guide
Step 2: Initialize a Sandbox Instance
Once you have the sandbox access token, you can create a sandbox instance in your preferred programming language. For SDK users, switching between sandbox and live mode is effortless - just toggle a configuration setting.
Python SDK
Node.js SDK
Java SDK
PHP SDK
configuration = upstox_client.Configuration(sandbox=True)
configuration.access_token = 'SANDBOX_ACCESS_TOKEN'


Complete example to Place an Order in Sandbox Mode
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client
from upstox_client.rest import ApiException

configuration = upstox_client.Configuration(sandbox=True)
configuration.access_token = 'SANDBOX_ACCESS_TOKEN'

api_instance = upstox_client.OrderApiV3(upstox_client.ApiClient(configuration))
body = upstox_client.PlaceOrderV3Request(quantity=1, product="D",validity="DAY", price=9.12, tag="string", instrument_token="NSE_EQ|INE669E01016", order_type="LIMIT",
                                         transaction_type="BUY", disclosed_quantity=0, trigger_price=0.0, is_amo=True, slice=True)

try:
    api_response = api_instance.place_order(body)
    print(api_response)
except ApiException as e:
    print("Exception when calling OrderApi->place_order: %s\n" % e)
Sandbox API coverage
We are actively expanding the suite of Sandbox APIs to enable seamless integration without market restrictions. This is a work in progress, and we aim to include all APIs over time. If an API is not yet available in Sandbox, please switch to live mode for full functionality.
For a list of APIs available in sandbox mode, refer to:
🔗 Sandbox-Enabled APIs

Previous
Installing the Upstox SDK

Next
MCP Integration

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK





















































Developer API
Getting Started
MCP Integration
On this page
Integrate Upstox Trading Data with AI Assistants via MCP
The Upstox Model Context Protocol (MCP) integration enables AI assistants like Claude, Claude Code, ChatGPT, Cursor, and VS Code to access your trading account data directly. This transforms generic AI tools into personalized financial advisors that understand your specific portfolio, positions, and market context.
What is Model Context Protocol (MCP)?
Model Context Protocol (MCP) enables AI assistants to access your account-specific trading data in real-time, creating context-aware conversations about your actual investments. Instead of generic market advice, you get insights based on your holdings, positions, and account status.
MCP provides these capabilities:
Account-scoped insights: Analysis of your actual portfolio composition, performance, and risk exposure
Real-time market context: Current prices, volumes, and market movements integrated into your conversations
Conversational API access: Natural language queries that map to precise API calls and data retrieval
Personalized research: Stock analysis that considers how potential investments fit with your existing holdings
The fundamental advantage: traditional AI assistants work with publicly available information only. MCP-enabled assistants understand your specific financial situation, making their guidance relevant to your actual investment decisions.
Compatible AI platforms include Claude Desktop (and the Claude web app), Claude Code, ChatGPT (with Developer mode), Cursor, and VS Code with GitHub Copilot, giving you flexibility in choosing your preferred development or analysis environment.
Supported Account Data
The Upstox MCP currently supports read-only access to the following account data, which your AI assistant uses to answer questions and generate insights about your account:
Holdings
Orders
Positions
Mutual funds
Funds
Profile
Setup Overview
Connect your Upstox account to AI assistants in minutes:
Select AI client: Use the tabs below to choose Claude Desktop, Claude Code, ChatGPT, Cursor, or VS Code with GitHub Copilot
Install dependencies: Download from nodejs.org (not needed for Claude Desktop or Claude Code, which install via the plugin marketplace)
Add MCP configuration: Insert Upstox server details in your AI client settings
Authorize account: Complete OAuth flow to securely link your trading account
Begin analysis: Start asking questions about your portfolio and market data
Ready to get started?
Select your client in the tabs below to see setup steps.
Prerequisites
Before setting up MCP integration, ensure you have:
An active Upstox trading account (non-dormant status) - Learn about Upstox API authentication
Node.js installed on your computer (not required for the Claude Desktop or Claude Code plugin methods)
One of the supported AI clients:
Claude Desktop application (or the Claude web app) — install via the plugin marketplace
Claude Code
ChatGPT (with Developer mode enabled)
Cursor IDE
VS Code with GitHub Copilot extension
Familiarity with Upstox API basics and developer documentation
Setting up Upstox MCP
Claude Desktop
Claude Code
ChatGPT
Cursor
VS Code with GitHub Copilot
Claude Desktop / web app — Add marketplace
Install the Upstox MCP through the Claude app's plugin marketplace — no config file or Node.js needed. The MCP server installs as a connector.

Open Settings → Plugins (or Customize → Plugins).
Under Personal plugins, click +, then Add marketplace.
In the URL field, enter the repository:
upstox/upstox-plugin-marketplace
Click Sync, then install the upstox-mcp plugin.
Open the installed plugin and go to its Connectors tab. Click Install (or Connect) next to the upstox connector.
Claude opens your browser for the Upstox OAuth consent. Approve access to link your account. Re-authorize once per day.
One marketplace, two plugins
The same marketplace also offers upstox-skill — an agent skill that can place and manage orders. Use upstox-mcp to analyze and ask questions (read-only); use upstox-skill to build and run trading workflows.
Note that upstox-skill is a Claude Code (and Codex) agent skill, not a chat connector. It runs inside a coding agent and uses the official upstox-python-sdk to execute trades and stream data, so it needs a Python environment with that SDK installed — it won't run in plain Claude Desktop chat. See the Agent Skills guide for setup.
Connector greyed out on a Team or Enterprise Claude account?
The Upstox MCP is a custom connector. On Team and Enterprise plans the Install / Connect button is disabled until an organization Owner enables connectors and allows custom connectors (Organization settings → Connectors), and your role has connector permission. On individual Pro/Max accounts you can connect it yourself. See Get started with custom connectors using remote MCP.
Capabilities with Upstox MCP
Once connected, your AI assistant can provide natural language analysis of your trading account and market data.
Portfolio Insights
Position breakdown: Detailed view of current holdings with performance metrics
Profit/loss tracking: P&L analysis across custom time periods
Diversification analysis: Sector and asset allocation assessment
Benchmark comparison: Performance relative to market indices
Account Data
Available margins: Real-time buying power and margin utilization - See margin APIs
Profile information: Account status and configuration details - User profile APIs
Activity summaries: Daily trading and P&L overviews
Market Research
Individual stock analysis: Research securities in context of your existing portfolio
Technical indicators: Chart analysis and trend identification
Example Use Cases
Here are some examples of how you can interact with your AI assistant using Upstox MCP:
Stock Analysis and Hold/Sell Decision
Ask your AI: "Check the stocks based on their current trends, valuations, Technicals etc and tell me if I should continue holding it or not"
Corporate Governance Analysis
Ask your AI: "Go through the latest board meetings and AGM/EGMs of the stocks in my company and derive the health of my portfolio"
Professional Investment Model Analysis
Ask your AI: "Run investment models of Goldman Sacch and other top PMSs on my Portfolio and give me a deep down of the analysis"
Portfolio Correlation Analysis
Ask your AI: "Find the correlation (beta) of my portfolio to the NIFTY index over the last 3 years. Show it to me on a chart with Week on week and QoQ timeframes"
Responsible Usage Guidelines
Best Practices
Multiple Sources: Use AI insights as one of many research tools in your investment process
Verify Data: Cross-check important information directly with the Upstox platform
Independent Research: Conduct your own fundamental and technical analysis
Professional Advice: Consult with qualified financial advisors for major investment decisions
Risk Management: Maintain proper risk management regardless of AI recommendations
Stay Informed: Keep up with market news and developments beyond AI analysis
Authentication and Security
Initial Authorization
First-time setup requires OAuth authorization to securely link your Upstox account. This ensures your trading data access is controlled and authenticated.
Daily Reconnection Policy
Daily re-authorization
For security, you must re-authorize your account connection daily. This prevents unauthorized access and ensures data freshness.
Current Limitations
Read-Only Access: The MCP integration provides read-only access to your account data. You cannot place orders, modify positions, or execute trades through the AI assistant.
Daily Re-authorization: Account connections expire daily and require re-authentication for security.
Feature Scope: Supports portfolio analysis, account data, and market research.
Troubleshooting
Connection Issues
If you're having trouble connecting:
Verify Node.js is properly installed (node --version)
Check that your Upstox account is active and not dormant
Ensure you're using the correct MCP server URL: https://mcp.upstox.com/mcp
Restart your AI client after configuration changes
Authentication Problems
If authorization fails:
Check your internet connection
Verify your Upstox login credentials work on the main platform
Try disconnecting and reconnecting your account
Clear browser cache if using web-based authentication
AI Response Issues
If AI responses seem incorrect or incomplete:
Remember that AI can make mistakes - always verify important information
Try rephrasing your question more specifically
Cross-check data directly with your Upstox account
Consider asking for clarification or additional details
Daily Reconnection
If you're prompted to reconnect:
This is normal security behavior - reconnect once per day
Use the same authorization process as initial setup
Your AI assistant will regain access to your current data
Support and Community
For technical support with MCP integration or general API questions, visit the Upstox Developer Community.
For account-specific issues, contact Upstox customer support through your trading platform.
Related Documentation:
Upstox API Overview - Complete API documentation
Authentication Guide - Learn about OAuth and API keys
WebSocket Implementation - Real-time market data streaming
Example Code - Sample implementations
SDK Documentation - Official software development kits
Frequently Asked Questions (FAQ)
How to integrate Upstox API with Claude AI?
To integrate Upstox API with Claude, open the Claude Desktop or web app, go to Settings → Plugins → Add marketplace, add the upstox/upstox-plugin-marketplace repository, install the upstox-mcp plugin, and connect the upstox connector to authenticate your Upstox account through the secure OAuth flow. No config file or Node.js is required.
How do I add the Upstox MCP marketplace in the Claude app?
In the Claude Desktop or web app, open Settings → Plugins (or Customize → Plugins), under Personal plugins click + → Add marketplace, enter the repository upstox/upstox-plugin-marketplace, click Sync, then install the upstox-mcp plugin. This installs the Upstox MCP as a connector with no config file or Node.js — Claude runs the Upstox OAuth flow in your browser on first use. See the Claude Desktop (plugin) tab above.
How do I connect Upstox MCP in Claude Code?
In Claude Code, run /plugin marketplace add upstox/upstox-plugin-marketplace followed by /plugin install upstox-mcp@upstox-plugins-official. No Node.js is needed because Claude Code connects to the hosted server (https://mcp.upstox.com/mcp) over HTTP directly. Run /mcp to verify the upstox server is listed, then authorize your Upstox account on first use. Note that add uses the repository name (upstox-plugin-marketplace) while install uses the marketplace name (@upstox-plugins-official).
The Install / Connect button for the Upstox connector is greyed out — why?
The Upstox MCP is a custom connector, and on Team and Enterprise Claude plans custom connectors are gated by organization policy. The button stays disabled until an organization Owner enables connectors and allows custom connectors under Organization settings → Connectors, and your assigned role has connector permission. On individual Pro/Max accounts you can add and connect it yourself. See Get started with custom connectors using remote MCP.
How do I connect Upstox MCP to ChatGPT?
Enable Developer mode in ChatGPT (Settings → Apps → Advanced settings), then create a custom app with the Upstox MCP endpoint (https://mcp.upstox.com/mcp). After the connection is confirmed, select Upstox MCP from Connectors in Chat. See the ChatGPT tab above and the official OpenAI guide for step-by-step instructions.
How do I connect Upstox MCP to Cursor?
Open Cursor Settings → Tools and MCP, click Add custom MCP (or the plus icon if you already have an MCP), add the Upstox MCP config (see the Cursor tab above), then go back to Settings and connect the Upstox MCP. For more on MCP in Cursor, see the official Cursor MCP documentation.
Can I use Upstox MCP with VS Code?
Yes, Upstox MCP works with VS Code through the GitHub Copilot extension. Add the MCP server configuration to your VS Code settings.json and use the /mcp command to access Upstox trading data.
Is Upstox MCP integration free?
Yes, connecting your Upstox account to AI assistants via MCP is completely free. You only need an active Upstox trading account and one of the supported AI clients.
What Upstox API data can I access through MCP?
Through Upstox MCP, you can access portfolio holdings, positions, profit & loss data, account margins, market quotes, and historical trading information in real-time.
How often do I need to reconnect Upstox MCP?
For security purposes, you need to reconnect your Upstox account once per day. This ensures your trading data remains secure and prevents unauthorized access.
Can I place trades through Upstox MCP?
No, Upstox MCP provides read-only access to your account data. You cannot place orders, modify positions, or execute trades through the AI assistant for security reasons.
What should I do if Upstox MCP authentication fails?
If authentication fails, check your internet connection, verify your Upstox credentials work on the main platform, try disconnecting and reconnecting.
How does Upstox MCP compare to other trading API integrations?
Upstox MCP offers seamless natural language interaction with your trading data, real-time portfolio analysis, and integration with popular AI assistants, making it more accessible than traditional API implementations.
What are the system requirements for Upstox MCP?
You need Node.js installed on your computer, an active Upstox trading account (non-dormant), and one of: Claude Desktop, ChatGPT (with Developer mode), Cursor, or VS Code with GitHub Copilot extension.
What if I have multiple Node.js or npx versions installed (for example via nvm)?
If you have multiple versions of node and npx installed (for example via nvm), your AI client might pick the wrong binary when starting the MCP server. This can lead to startup errors similar to those described in this GitHub issue.
In this case, configure your MCP server by pointing directly to the full paths of node and npx instead of relying on the default npx on your PATH. For example:
{
  "mcpServers": {
    "mcp-server-upstox-api": {
      "command": "/Users/name/.nvm/versions/node/v20.19.4/bin/node",
      "args": [
        "/Users/name/.nvm/versions/node/v20.19.4/bin/npx",
        "mcp-remote",
        "https://mcp.upstox.com/mcp"
      ]
    }
  }
}
Adjust the paths and URL to match your local Node.js installation and MCP endpoint.

Important Disclaimers
Investment Decision Responsibility
AI-generated analysis serves as research support, not investment advice. Always:
Verify information independently and conduct your own due diligence
Cross-check AI outputs with multiple sources and professional analysis
Consult qualified financial advisors for major investment decisions
Recognize that AI responses may contain errors or incomplete information
Treat AI insights as research starting points, not final guidance
Data Verification
Although MCP provides real-time account access, confirm critical information directly through the Upstox platform before taking action.
Usage Terms: This integration offers data access for analytical purposes only. Investment outcomes remain your responsibility. Neither Upstox nor AI platforms bear liability for decisions based on AI-generated insights.

Previous
Build using Sandbox

Next
User

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK




























































Developer API
Account & Funds
User
Get Profile
On this page
GET
/user/profile
Get Profile
API to retrieve user profile data, which encompasses details such as supported exchanges, enabled product offerings, and permitted order types. If you're business and developing an application for multi-client API usage, you can utilize this data to display in the user's profile section.
Request
curl --location 'https://api.upstox.com/v2/user/profile' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "email": "******",
    "exchanges": ["NSE", "NFO", "BSE", "CDS", "BFO", "BCD"],
    "products": ["D", "CO", "I"],
    "broker": "UPSTOX",
    "user_id": "******",
    "user_name": "******",
    "order_types": ["MARKET", "LIMIT", "SL", "SL-M"],
    "user_type": "individual",
    "poa": false,
    "ddpi": false,
    "is_active": true
  }
}


Sample Code
Get user profile information using access token
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/user/profile'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}
response = requests.get(url, headers=headers)

print(response.status_code)
print(response.json())


Previous
User

Next
Get Fund And Margin

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK




























































Developer API
Account & Funds
User
Get Fund And Margin
On this page
GET
/user/get-funds-and-margin
Get Fund And Margin
API to retrieve user funds data for both the equity and commodity markets, including data such as the margin utilized by the user, the available margin for trading, and the total payin amount during the day.
Request
curl --location 'https://api.upstox.com/v2/user/get-funds-and-margin' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.


Query Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "equity": {
      "used_margin": 0.8,
      "payin_amount": 200.0,
      "span_margin": 0.0,
      "adhoc_margin": 0.0,
      "notional_cash": 0.0,
      "available_margin": 15507.46,
      "exposure_margin": 0.0
    },
    "commodity": {
      "used_margin": 0,
      "payin_amount": 0,
      "span_margin": 0,
      "adhoc_margin": 0,
      "notional_cash": 0,
      "available_margin": 0,
      "exposure_margin": 0
    }
  }
}


Sample Code
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/user/get-funds-and-margin'

headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.status_code)
print(response.json())
NOTE
From 19th July 2025, combined funds for both Equity and Commodity segments will be returned in the equity object. For more information please refer to Fund and Margin API Response Change annoucement.
The Funds service is down for maintenance from 12:00 AM to 5:30 AM IST daily and is not available for usage during these hours. Users are advised to plan their activities accordingly.

Previous
Get Profile

Next
Get Fund and Margin V3

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK




























































Developer API
Account & Funds
User
Get Fund and Margin V3
On this page
GET
/user/get-funds-and-margin
Get Fund and Margin V3
API to retrieve a detailed balance breakdown for the user across cash and pledged margin components. The response is organized into two top-level categories:
available_to_trade covers funds and margin that are ready to use for trading, broken down into cash and pledge sub-buckets, each with a full breakdown of margin in use.
unavailable_to_trade covers funds that are present in the account but cannot yet be traded, including unsettled profit and unavailable pledge collateral.
Request
curl --location 'https://api.upstox.com/v3/user/get-funds-and-margin' \
--header 'Accept: application/json' \
--header 'Api-Version: 3.0' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section.

Responses
200
4XX
Response Body
{
    "status": "success",
    "data": {
        "available_to_trade": {
            "total": 5379.03,
            "cash_available_to_trade": {
                "total": 5117.34,
                "cash": {
                    "opening_balance": 5137.34,
                    "added_today": 110.0,
                    "withdrawn_today": -130.0,
                    "amount_from_stock_sale": 0.0,
                    "unpaid_charges": 0
                },
                "margin_used": {
                    "total": 0.0,
                    "mtf": 0.0,
                    "loss": {
                        "total": 0.0,
                        "realised": 0.0,
                        "unrealised": 0.0
                    },
                    "span_exposure": 0.0,
                    "cash_margin_var_elm": 0.0,
                    "premium_present": 0.0,
                    "delivery_margin": {
                        "total": 0.0,
                        "equity": 0.0,
                        "fo_settlement": 0.0
                    }
                }
            },
            "pledge_available_to_trade": {
                "total": 261.69,
                "margin_from_pledge": {
                    "total": 263.49,
                    "equity": 263.49,
                    "mutual_funds": 0.0
                },
                "margin_used": {
                    "total": 1.8,
                    "mtf": 0.0,
                    "span_exposure": 0.0,
                    "cash_margin_var_elm": 1.8,
                    "premium_present": 0.0,
                    "delivery_margin": {
                        "total": 0.0,
                        "equity": 0.0,
                        "fo_settlement": 0.0
                    }
                }
            }
        },
        "unavailable_to_trade": {
            "cash_unavailable_to_trade": {
                "unsettled_profit": {
                    "todays_profit": 0.0,
                    "previous_days": 0.0
                }
            },
            "pledge_unavailable_to_trade": {
                "equity": 0.0,
                "mutual_funds": 0.0
            }
        }
    }
}
Response
available_to_trade
cash_available_to_trade
pledge_available_to_trade
unavailable_to_trade


Sample Code
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v3/user/get-funds-and-margin'

headers = {
    'Accept': 'application/json',
    'Api-Version': '3.0',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.status_code)
print(response.json())
Maintenance Window
The Funds service is down for maintenance from 12:00 AM to 5:30 AM IST daily and returns a 423 Locked response during this period. Plan your integration to handle this window gracefully.

Previous
Get Fund And Margin

Next
Kill Switch

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK




























































Developer API
Account & Funds
User
Kill Switch
On this page
POST
/user/kill-switch
Kill Switch
API to enable or disable one or more trading segments in a single request. The kill switch is a risk management tool that lets traders temporarily halt activity in specific segments to avoid emotionally-driven or compulsive trading decisions. When a segment is disabled, all pending orders in that segment are cancelled and new orders are blocked.
For more information on the kill switch and how it helps with trade risk management, click here.
Before using the kill switch
All open positions in a segment must be closed before you can disable it.
After disabling a segment, a 12-hour cooling period applies before it can be re-enabled.
All open orders in the segment are cancelled automatically when it is disabled.
If your given segment is inactive or dormant kill switch cannot be enabled as trading is already blocked. You can only enable kill switch for segments that are currently active.
Request
curl --location 'https://api.upstox.com/v2/user/kill-switch' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}' \
--data '[
      {
        "segment": "NSE_FO",
        "action": "DISABLE"
      },
      {
        "segment": "NSE_EQ",
        "action": "DISABLE"
      },
      {
        "segment": "NCD_FO",
        "action": "ENABLE"
      }
]'
Additional samples in various languages are available in the Sample Code section on this page.
Request Body
The request body is an array of segment update objects. You can update multiple segments in a single call.
Atomic update behaviour
If any segment in the request fails to update, none of the other segments in the same request will be updated.
Responses
200
4XX
Response Body
{
    "status": "success",
    "data": [
        {
            "segment": "MCX_FO",
            "segment_status": "INACTIVE",
            "kill_switch_enabled": false
        },
        {
            "segment": "NCD_FO",
            "segment_status": "ACTIVE",
            "kill_switch_enabled": false
        },
        {
            "segment": "NSE_EQ",
            "segment_status": "ACTIVE",
            "kill_switch_enabled": true
        },
        {
            "segment": "BCD_FO",
            "segment_status": "ACTIVE",
            "kill_switch_enabled": false
        },
        {
            "segment": "BSE_FO",
            "segment_status": "ACTIVE",
            "kill_switch_enabled": false
        },
        {
            "segment": "NSE_FO",
            "segment_status": "ACTIVE",
            "kill_switch_enabled": true
        },
        {
            "segment": "BSE_EQ",
            "segment_status": "ACTIVE",
            "kill_switch_enabled": true
        },
        {
            "segment": "NSE_COM",
            "segment_status": "INACTIVE",
            "kill_switch_enabled": false
        }
    ]
}


Sample Code
Disable a trading segment using the kill switch
Python
Node.js
Java
PHP
import requests
import json

url = 'https://api.upstox.com/v2/user/kill-switch'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}
payload = [
    {
        "segment": "NSE_EQ",
        "action": "DISABLE"
    }
]
response = requests.post(url, headers=headers, data=json.dumps(payload))

print(response.status_code)
print(response.json())

Previous
Get Fund and Margin V3

Next
Kill Switch Status

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK




























































Developer API
Account & Funds
User
Get Static IPs
On this page
GET
/user/ip
Get Static IPs
API to retrieve the primary and optional secondary static IP addresses registered for your user account (static IPs are managed at user level). The same registration applies regardless of which OAuth client issued your token.
When static-IP enforcement applies to order placement, requests from unregistered IPs may fail. For My Apps UI steps and platform rules, see the My Apps guide.
Registered addresses are returned in standard IPv4 or IPv6 notation.
Request
curl --location 'https://api.upstox.com/v2/user/ip' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.

Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "primary_ip": "122.181.101.247",
    "secondary_ip": "128.1.1.2",
    "primary_ip_updated_at": "2026-04-03 17:17:50",
    "secondary_ip_updated_at": "2026-04-03 17:17:50"
  }
}


Sample Code
Get static IPs for the authenticated user
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/user/ip'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.text)

Previous
Kill Switch Status

Next
Update Static IPs

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK




























































Developer API
Account & Funds
User
Update Static IPs
On this page
PUT
/user/ip
Update Static IPs
API to update the primary and optional secondary static IP addresses for your user account (user-level registration). The same IPs apply across your API usage regardless of which OAuth client issued the token.
Platform rules (aligned with My Apps guide):
Static IPs can only be changed once per calendar week.
After a successful update, the existing access tokens are invalidated and you need to generate a new one.
When enforcement is active, orders may be rejected unless traffic originates from a registered IP.
primary_ip and secondary_ip must use standard IPv4 or IPv6 address notation.
Request
curl --location --request PUT 'https://api.upstox.com/v2/user/ip' \
--header 'Accept: application/json' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {your_access_token}' \
--data '{
  "primary_ip": "203.0.113.10",
  "secondary_ip": "203.0.113.11"
}'
For additional samples in various languages, please refer to the Sample code section on this page.


Request Body
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "primary_ip": "122.181.101.247",
    "secondary_ip": "128.1.1.2",
    "primary_ip_updated_at": "2026-04-03 17:17:50",
    "secondary_ip_updated_at": "2026-04-03 17:17:50",
    "access_tokens_invalidated": true
  }
}


Sample Code
Update static IPs for the authenticated user
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/user/ip'
headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

data = {
    'primary_ip': '203.0.113.10',
    'secondary_ip': '203.0.113.11'
}

response = requests.put(url, headers=headers, json=data)
print(response.text)

Previous
Get Static IPs

Next
Payments

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK


































































Developer API
Account & Funds
Payments
Get Payins
On this page
GET
/user/payments/payin
Get Payins
API to retrieve the pay-in (fund deposit) transactions for the authenticated user. It returns details such as amount, payment mode, current status, bank name, transaction ID, and applicable charges. The response includes the most recent 20 transactions.
Request
curl --location 'https://api.upstox.com/v2/user/payments/payin' \
--header 'accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Responses
200
400
Response Body
{
    "status": "success",
    "data": [
        {
            "amount": 16995.00,
            "mode": "NEFT",
            "status": "SUCCESS",
            "currency": "INR",
            "bank_name": "AXIS BANK",
            "transaction_id": "qws_0426_9680091",
            "created_at": "2026-04-19 16:35:36"
        },
        {
            "amount": 100,
            "mode": "UPI",
            "status": "SUCCESS",
            "currency": "INR",
            "bank_name": "AXIS BANK",
            "transaction_id": "order_Sx67XZ8jTEAHiJ",
            "created_at": "2026-06-03 14:17:27"
        }
    ]
}


Sample Code
Get payins
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/user/payments/payin'
headers = {
    'accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}',
}
print(requests.get(url, headers=headers).json())

Previous
Payments

Next
Get Payouts

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK


































































Developer API
Account & Funds
Payments
Get Payouts
On this page
GET
/user/payments/payout
Get Payouts
API to retrieve the payout (fund withdrawal) transactions for the authenticated user. It returns details such as amount, payment mode, current status, bank name, transaction ID, and applicable charges. The response includes the most recent 20 transactions.
Request
curl --location 'https://api.upstox.com/v2/user/payments/payout' \
--header 'accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Responses
200
400
Response Body
{
    "status": "success",
    "data": [
        {
            "transaction_id": "qws_0426_9680091",
            "status": "COMPLETED",
            "mode": "NEFT",
            "amount": 16995.00,
            "currency": "INR",
            "eta": "2026-04-19 13:30:00",
            "created_at": "2026-04-19 13:25:56",
            "bank_name": "AXIS BANK"
        },
        {
            "transaction_id": "imps_0426_7654321",
            "status": "TRANSFER_IN_PROGRESS",
            "mode": "IMPS",
            "amount": 10000.00,
            "currency": "INR",
            "eta": "2026-04-19 12:35:00",
            "created_at": "2026-04-19 12:30:00",
            "bank_name": "ICICI BANK"
        }
    ]
}


Sample Code
Get payouts
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/user/payments/payout'
headers = {
    'accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}',
}
print(requests.get(url, headers=headers).json())

Previous
Get Payins

Next
Get Payout Modes

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK















































































Developer API
Account & Funds
Payments
Get Payout Modes
On this page
GET
/user/payments/payout/modes
Get Payout Modes
API to retrieve the available fund withdrawal (payout) modes and eligibility criteria for the authenticated user. Returns details for NEFT (Standard) and IMPS (Instant) modes, including the minimum and maximum withdrawal limits, current eligibility status, and the amount available for withdrawal.
For IMPS-specific eligibility conditions, see Instant Withdrawal Eligibility.
The Payout APIs are subject to a separate rate limit. For more information, please check here.
Request
curl --location 'https://api.upstox.com/v2/user/payments/payout/modes' \
--header 'accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Responses
200
400
Response Body
{
    "status": "success",
    "data": {
        "neft": {
            "status": "ENABLED",
            "eligible": true,
            "min_amount": 100.0,
            "max_amount": 200000000.0,
            "currency": "INR",
            "eligible_amount": 15000.0
        },
        "imps": {
            "status": "ENABLED",
            "eligible": false,
            "min_amount": 100.0,
            "max_amount": 500000.0,
            "currency": "INR",
            "eligible_amount": 0.0
        }
    }
}


Sample Code
Get payout modes
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/user/payments/payout/modes'
headers = {
    'accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}',
}
print(requests.get(url, headers=headers).json())

Previous
Get Payouts

Next
Payout Request

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK















































































Developer API
Account & Funds
Payments
Payout Request
On this page
POST
/user/payments/payout
Payout Request
API to place a fund withdrawal (payout) request for the authenticated user. Supports Standard (NEFT) and Instant (IMPS) withdrawal modes. The withdrawal is credited to the user's registered primary bank account.
Check Eligibility and Withdrawal Fees
Use the Get Payout Modes API to fetch the modes available and eligible withdrawal amount to your account along with the minimum and maximum withdrawal amounts for each mode before placing a request.
NEFT (Standard): Free of charge.
IMPS (Instant): Credited within minutes subject to eligibility.
Fee: ₹20 + GST (Basic plan); Free (Plus plan).
Only one active withdrawal request is allowed at a time.
IMPS requests cannot be edited once initiated.
The Payout APIs are subject to a separate rate limit. For more information, please check here.
Instant Withdrawal Eligibility
IMPS (Instant) withdrawals are subject to real-time eligibility checks. See Instant Withdrawal Eligibility for the full list of criteria.
Request
curl --location --request POST 'https://api.upstox.com/v2/user/payments/payout' \
--header 'accept: application/json' \
--header 'Authorization: Bearer {your_access_token}' \
--header 'Content-Type: application/json' \
--data '{"mode": "IMPS", "amount": 5000.0}'
Additional samples in various languages are available in the Sample Code section on this page.
Request Body
Responses
200
400
Response Body
{
    "status": "success",
    "data": {
        "transaction_id": "ABC123XYZ-GC0173-7HIMPSABC",
        "status": "received",
        "mode": "IMPS",
        "amount": 5000.0,
        "currency": "INR",
        "eta": "2026-04-19 13:30:00",
        "created_at": "2026-04-19 13:25:56",
        "bank_name": "AXIS BANK",
        "message": "Your instant withdrawal request has been received. Funds will be credited within 5 minutes."
    }
}


Sample Code
Payout request
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/user/payments/payout'
headers = {
    'accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}',
    'Content-Type': 'application/json',
}
payload = {
    'mode': 'IMPS',
    'amount': 5000.0,
}
print(requests.post(url, headers=headers, json=payload).json())

Previous
Get Payout Modes

Next
Modify Payout

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK















































































Developer API
Account & Funds
Payments
Modify Payout
On this page
PUT
/user/payments/payout/:transaction_id
Modify Payout
API to update the amount of an existing pending fund withdrawal (payout) request. Only requests currently in RECEIVED status can be modified. IMPS requests cannot be edited once initiated.
The eligibility and withdrawal fee criteria described in Payout Request also apply to modifying a payout.
Request
curl --location --request PUT 'https://api.upstox.com/v2/user/payments/payout/{transaction_id}' \
--header 'accept: application/json' \
--header 'Authorization: Bearer {your_access_token}' \
--header 'Content-Type: application/json' \
--data '{"amount": 10000.0}'
Replace {transaction_id} with the transaction_id returned by the Payout Request API.
Additional samples in various languages are available in the Sample Code section on this page.
Request Body
Responses
200
400
Response Body
{
    "status": "success",
    "data": {
        "transaction_id": "ABC123XYZ-GC0173-7HIMPSABC",
        "status": "received",
        "mode": "NEFT",
        "amount": 10000.0,
        "currency": "INR",
        "eta": "2026-04-19 14:00:00",
        "created_at": "2026-04-19 13:25:56",
        "bank_name": "AXIS BANK",
        "message": "Your withdrawal request has been updated successfully."
    }
}


Sample Code
Modify payout
Python
Node.js
Java
PHP
import requests

transaction_id = 'ABC123XYZ-GC0173-7HIMPSABC'
url = f'https://api.upstox.com/v2/user/payments/payout/{transaction_id}'
headers = {
    'accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}',
    'Content-Type': 'application/json',
}
payload = {
    'amount': 10000.0,
}
print(requests.put(url, headers=headers, json=payload).json())

Previous
Payout Request

Next
Cancel Payout

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK















































































Developer API
Account & Funds
Payments
Cancel Payout
On this page
DELETE
/user/payments/payout/:transaction_id
Cancel Payout
API to cancel a pending fund withdrawal (payout) request for the authenticated user. Only requests currently in RECEIVED status can be cancelled. Once a request moves to processing, it can no longer be cancelled. IMPS requests cannot be cancelled once initiated.
Request
curl --location --request DELETE 'https://api.upstox.com/v2/user/payments/payout/{transaction_id}' \
--header 'accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Replace {transaction_id} with the transaction_id returned by the Payout Request API.
Additional samples in various languages are available in the Sample Code section on this page.
Responses
200
400
Response Body
{
    "status": "success",
    "data": {
        "transaction_id": "ABC123XYZ-GC0173-7HIMPSABC",
        "message": "Your withdrawal request of Amount 110.10 is deleted successfully."
    }
}


Sample Code
Cancel payout
Python
Node.js
Java
PHP
import requests

transaction_id = 'ABC123XYZ-GC0173-7HIMPSABC'
url = f'https://api.upstox.com/v2/user/payments/payout/{transaction_id}'
headers = {
    'accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}',
}
print(requests.delete(url, headers=headers).json())

Previous
Modify Payout

Next
Charges

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK
















































































Developer API
Account & Funds
Charges
Brokerage Details
On this page
GET
/charges/brokerage
Brokerage Details
API for calculating brokerage fees associated with stock. It accepts input parameters like the instrument, quantity, and other necessary details, and provides a comprehensive breakdown of the total charges.
Request
curl --location 'https://api.upstox.com/v2/charges/brokerage?instrument_token=NSE_EQ%7CINE669E01016&quantity=10&product=D&transaction_type=BUY&price=13.7' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Query Parameters
Responses
200
4XX
Response Body
{
    "status": "success",
    "data": {
        "charges": {
            "total": 208.27,
            "brokerage": 0.0,
            "taxes": {
                "gst": 1.02,
                "stt": 175.0,
                "stamp_duty": 26.23
            },
            "other_charges": {
                "transaction": 5.68,
                "clearing": 0.0,
                "ipft": 0.17,
                "sebi_turnover": 0.17
            },
            "dp_plan": {
                "name": "DP3A",
                "min_expense": 18.5
            }
            "otherTaxes": {
                "transaction": 5.68,
                "clearing": 0.0,
                "ipft": 0.17,
                "sebi_turnover": 0.17
            },
            "dpPlan": {
                "name": "DP3A",
                "min_expense": 18.5
            },
        }
    }
}


Sample Code
Equity delivery orders
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/charges/brokerage?instrument_token=NSE_EQ%7CINE669E01016&quantity=10&product=D&transaction_type=BUY&price=13.7' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Equity intraday orders
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/charges/brokerage?instrument_token=NSE_EQ%7CINE669E01016&quantity=10&product=I&transaction_type=BUY&price=13.7' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Equity futures and options delivery orders
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/charges/brokerage?instrument_token=NSE_FO%7C35271&quantity=10&product=D&transaction_type=BUY&price=1400' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Equity futures and options intraday orders
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/charges/brokerage?instrument_token=NSE_FO%7C35271&quantity=10&product=I&transaction_type=BUY&price=1400' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Charges

Next
Margins

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































































Developer API
Account & Funds
Margins
Margin Details
On this page
POST
/charges/margin
Margin Details
This API provides the functionality to retrieve the margin for an instrument. It accepts input parameters like the instrument, quantity, transaction_type and product.
Margin fields that are not applicable will be set to zero for a given instrument. A maximum of 20 instruments is allowed per request
Request
curl -X 'POST' \
  'https://api.upstox.com/v2/charges/margin' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer {your_access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "instruments": [
    {
      "instrument_key": "NSE_EQ|INE669E01016",
      "quantity": 1,
      "transaction_type": "BUY",
      "product": "D"
      
    }
  ]
}'
Additional samples in various languages are available in the Sample Code section on this page.
Request Body
Responses
200
4XX
Response Body
EQ
Futures
Options
MCX
Currency
{
  "status": "success",
  "data": {
    "margins": [
      {
        "span_margin": 0,
        "exposure_margin": 0,
        "equity_margin": 33.6,
        "net_buy_premium": 0,
        "additional_margin": 0,
        "total_margin": 33.6,
        "tender_margin": 0
      }
    ],
    "required_margin": 33.6,
    "final_margin": 33.6
  }
}
Field Description


Sample Code
Equity delivery orders
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl -X 'POST' \
  'https://api.upstox.com/v2/charges/margin' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer {your_access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "instruments": [
    {
      "instrument_key": "NSE_EQ|INE669E01016",
      "quantity": 1,
      "transaction_type": "BUY",
      "product": "D"
      
    }
  ]
}'
Future delivery orders
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl -X 'POST' \
  'https://api.upstox.com/v2/charges/margin' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer {your_access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "instruments": [
    {
      "instrument_key": "NSE_FO|35000",
      "quantity": 1,
      "transaction_type": "BUY",
      "product": "D"
      
    }
  ]
}'
Option delivery orders
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl -X 'POST' \
  'https://api.upstox.com/v2/charges/margin' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer {your_access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "instruments": [
    {
      "instrument_key": "NSE_FO|54524",
      "quantity": 1,
      "transaction_type": "BUY",
      "product": "D"
      
    }
  ]
}'
MCX delivery orders
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl -X 'POST' \
  'https://api.upstox.com/v2/charges/margin' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer {your_access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "instruments": [
    {
      "instrument_key": "MCX_FO|435356",
      "quantity": 1,
      "transaction_type": "BUY",
      "product": "D"
      
    }
  ]
}'
Currency delivery orders
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl -X 'POST' \
  'https://api.upstox.com/v2/charges/margin' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer {your_access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
  "instruments": [
    {
      "instrument_key": "NCD_FO|15758",
      "quantity": 1,
      "transaction_type": "BUY",
      "product": "D"
      
    }
  ]
}'

Previous
Margins

Next
Orders

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK


































































































Developer API
Orders & Trading
IPO
Get IPOs
On this page
GET
/ipos
Get IPOs
API to retrieve a list of IPOs available on Indian exchanges. By default it returns currently open IPOs. Use the status and issue_type parameters to filter by lifecycle stage or market segment.
Use the id from each listing item as the path parameter in Get IPO Details to fetch the full data for that IPO — including price band, lot size, event timeline, registrar info, and live subscription figures.
IPO lifecycle
An IPO moves through four stages. The status parameter maps directly to these stages:
Issue types
Query Parameters
Request
curl --location 'https://api.upstox.com/v2/ipos?status=open&issue_type=regular&page_number=1&records=30' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": [
    {
      "id": "yaashvi-jewellers-limited-ipo",
      "symbol": "YAASHVI",
      "name": "Yaashvi Jewellers IPO",
      "status": "open",
      "isin": "INE1T6L01010",
      "issue_type": "sme",
      "issue_size": 44,
      "industry": "Diamond & Jewellery",
      "minimum_price": 83,
      "maximum_price": 83,
      "bidding_start_date": "2026-05-25",
      "bidding_end_date": "2026-05-27",
      "total_subscription": "0.0"
    },
    {
      "id": "m-r-maniveni-foods-limited-ipo",
      "symbol": "MANIVENI",
      "name": "M R Maniveni Foods IPO",
      "status": "open",
      "isin": "INE0YD301010",
      "issue_type": "sme",
      "issue_size": 27,
      "industry": "Consumer Food",
      "minimum_price": 51,
      "maximum_price": 52,
      "bidding_start_date": "2026-05-22",
      "bidding_end_date": "2026-05-26",
      "total_subscription": "1.27"
    }
  ],
  "meta_data": {
    "page": {
      "page_number": 1,
      "total_pages": 1,
      "records": 2,
      "total_records": 2
    }
  }
}


Sample Code
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/ipos'
params = {
    'status': 'open',
    'issue_type': 'regular',
    'page_number': 1,
    'records': 30
}
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, params=params, headers=headers)
print(response.json())

Previous
IPO

Next
Get IPO Details

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK


































































































Developer API
Orders & Trading
IPO
Get IPO Details
On this page
GET
/ipos/:id
Get IPO Details
API to retrieve full details for a specific IPO using its slug identifier. The response includes the price band, lot size, bidding schedule, daily bidding hours, key event timeline, registrar contact information, prospectus URLs, and live subscription data.
To get the id for an IPO, first call Get IPOs and use the id field from any item in the response.
Path Parameters
Request
curl --location 'https://api.upstox.com/v2/ipos/autofurnish-limited-ipo' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "id": "autofurnish-limited-ipo",
    "symbol": "AFLTD",
    "name": "Autofurnish IPO",
    "status": "open",
    "isin": "INE18HI01019",
    "issue_type": "sme",
    "issue_size": 15,
    "industry": "Automobile Two & Three Wheelers",
    "minimum_price": 41,
    "maximum_price": 41,
    "bidding_start_date": "2026-05-21",
    "bidding_end_date": "2026-05-25",
    "daily_start_time": "10:00:00",
    "daily_end_time": "17:00:00",
    "face_value": 10,
    "tick_size": null,
    "lot_size": 3000,
    "minimum_quantity": 6000,
    "cut_off_price": 41,
    "listing_price": null,
    "listing_exchange": "BSE",
    "rhp_url": null,
    "drhp_url": "https://www.bsesme.com/download/325882/SME_IPO%20InPrinciple/DP_Autofurnish_Final_20250930195434.pdf",
    "timeline": {
      "pre_apply_start_date": "2026-05-20",
      "application_start_date": "2026-05-21",
      "application_end_date": "2026-05-25",
      "allotment_start_date": "2026-05-26",
      "allotment_date": "2026-05-27",
      "refund_initiation_date": "2026-05-27",
      "listing_date": "2026-05-29",
      "mandate_end_date": "2026-07-06"
    },
    "registrar_info": {
      "name": "SKYLINE FINANCIAL SERVICES PRIVATE LIMITED",
      "email": "virenr@skylinerta.com",
      "contact_name": "Mr. Anuj Rana",
      "contact_number": "+91-11-40450193-97",
      "website": "https://www.skylinerta.com/",
      "registrar": "SKYLINE"
    },
    "total_subscription": "0.68"
  }
}


Sample Code
Python
Node.js
Java
PHP
import requests

ipo_id = 'autofurnish-limited-ipo'
url = f'https://api.upstox.com/v2/ipos/{ipo_id}'
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)
print(response.json())

Previous
Get IPOs

Next
Portfolio

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK






































































































Developer API
Portfolio
Portfolio
Get Positions
On this page
GET
/portfolio/short-term-positions
Get Positions
API to retrieve the current positions for the user. These assets remain within the positions portfolio until they are either sold or reach their standard three-month expiration date in the case of derivatives. If any equity positions are carried overnight, they are automatically shifted to the holdings portfolio on the following trading day.
Request
curl --location 'https://api.upstox.com/v2/portfolio/short-term-positions' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
Response Body
{
  "status": "success",
  "data": [
    {
      "exchange": "NFO",
      "multiplier": 1.0,
      "value": 39.75,
      "pnl": 26.25,
      "product": "D",
      "instrument_token": "NSE_FO|52618",
      "average_price": 2.65,
      "buy_value": 0.0,
      "overnight_quantity": 15,
      "day_buy_value": 0.0,
      "day_buy_price": 0.0,
      "overnight_buy_amount": 39.75,
      "overnight_buy_quantity": 15,
      "day_buy_quantity": 0,
      "day_sell_value": 0.0,
      "day_sell_price": 0.0,
      "overnight_sell_amount": 0.0,
      "overnight_sell_quantity": 0,
      "day_sell_quantity": 0,
      "quantity": 15,
      "last_price": 1.75,
      "unrealised": -658304.25,
      "realised": -0.0,
      "sell_value": 0.0,
      "trading_symbol": "BANKNIFTY23OCT38000PE",
      "tradingsymbol": "BANKNIFTY23OCT38000PE",
      "close_price": 1.95,
      "buy_price": 2.65,
      "sell_price": 0.0
    },
    {
      "exchange": "BSE",
      "multiplier": 1.0,
      "value": 0.8,
      "pnl": 0.01,
      "product": "D",
      "instrument_token": "BSE_EQ|INE220J01025",
      "average_price": null,
      "buy_value": 0.8,
      "overnight_quantity": 0,
      "day_buy_value": 0.8,
      "day_buy_price": 0.8,
      "overnight_buy_amount": 0.0,
      "overnight_buy_quantity": 0,
      "day_buy_quantity": 1,
      "day_sell_value": 0.0,
      "day_sell_price": 0.0,
      "overnight_sell_amount": 0.0,
      "overnight_sell_quantity": 0,
      "day_sell_quantity": 0,
      "quantity": 1,
      "last_price": 0.81,
      "unrealised": 0.01,
      "realised": -0.0,
      "sell_value": 0.0,
      "trading_symbol": "FCONSUMER",
      "tradingsymbol": "FCONSUMER",
      "close_price": 0.8,
      "buy_price": 0.8,
      "sell_price": 0.0
    },
    {
      "exchange": "MCX",
      "multiplier": 1.0,
      "value": 5867.0,
      "pnl": 6005.0,
      "product": "D",
      "instrument_token": "MCX_FO|259711",
      "average_price": 5867.0,
      "buy_value": 0.0,
      "overnight_quantity": 1,
      "day_buy_value": 0.0,
      "day_buy_price": 0.0,
      "overnight_buy_amount": 5867.0,
      "overnight_buy_quantity": 1,
      "day_buy_quantity": 0,
      "day_sell_value": 0.0,
      "day_sell_price": 0.0,
      "overnight_sell_amount": 0.0,
      "overnight_sell_quantity": 0,
      "day_sell_quantity": 0,
      "quantity": 1,
      "last_price": 6005.0,
      "unrealised": 0.0,
      "realised": -0.0,
      "sell_value": 0.0,
      "trading_symbol": "GOLDPETAL23DECFUT",
      "tradingsymbol": "GOLDPETAL23DECFUT",
      "close_price": 6005.0,
      "buy_price": 5867.0,
      "sell_price": 0.0
    },
    {
      "exchange": "CDS",
      "multiplier": 1000.0,
      "value": 5.0,
      "pnl": 2.5,
      "product": "D",
      "instrument_token": "NCD_FO|13177",
      "average_price": 0.005,
      "buy_value": 0.0,
      "overnight_quantity": 1,
      "day_buy_value": 0.0,
      "day_buy_price": 0.0,
      "overnight_buy_amount": 0.005,
      "overnight_buy_quantity": 1,
      "day_buy_quantity": 0,
      "day_sell_value": 0.0,
      "day_sell_price": 0.0,
      "overnight_sell_amount": 0.0,
      "overnight_sell_quantity": 0,
      "day_sell_quantity": 0,
      "quantity": 1,
      "last_price": 0.0025,
      "unrealised": -83265.0,
      "realised": -0.0,
      "sell_value": 0.0,
      "trading_symbol": "USDINR23OCT85.5CE",
      "tradingsymbol": "USDINR23OCT85.5CE",
      "close_price": 0.0025,
      "buy_price": 0.005,
      "sell_price": 0.0
    },
    {
      "exchange": "NSE",
      "multiplier": 1.0,
      "value": 0.0,
      "pnl": 0.45,
      "product": "D",
      "instrument_token": "NSE_EQ|INE062A01020",
      "average_price": null,
      "buy_value": 570.95,
      "overnight_quantity": 0,
      "day_buy_value": 570.95,
      "day_buy_price": 570.95,
      "overnight_buy_amount": 0.0,
      "overnight_buy_quantity": 0,
      "day_buy_quantity": 1,
      "day_sell_value": 571.4,
      "day_sell_price": 571.4,
      "overnight_sell_amount": 0.0,
      "overnight_sell_quantity": 0,
      "day_sell_quantity": 1,
      "quantity": 0,
      "last_price": 571.2,
      "unrealised": 0.0,
      "realised": 0.45,
      "sell_value": 571.4,
      "trading_symbol": "SBIN",
      "tradingsymbol": "SBIN",
      "close_price": 572.65,
      "buy_price": 570.95,
      "sell_price": 571.4
    }
  ]
}


Sample Code
Get user positions
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/portfolio/short-term-positions'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.json())


Previous
Portfolio

Next
Get MTF Positions

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK






































































































Developer API
Portfolio
Portfolio
Get MTF Positions
On this page
GET
/portfolio/mtf-positions
Get MTF Positions
API to retrieve the current Margin Trade Funding (MTF) positions for the user. MTF is a facility that allows investors to buy securities by paying a fraction of the transaction value, with the remaining amount funded by the Upstox. These positions remain in the MTF portfolio until they are either sold or the loan is repaid.
Request
curl --location 'https://api.upstox.com/v3/portfolio/mtf-positions' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
Response Body
{
  "status": "success",
  "data": [
    {
      "exchange": "NSE",
      "multiplier": 1.0,
      "value": 4285.0,
      "pnl": 128.55,
      "product": "MTF",
      "instrument_token": "NSE_EQ|INE062A01020",
      "average_price": 571.33,
      "buy_value": 4285.0,
      "overnight_quantity": 5,
      "day_buy_value": 2856.65,
      "day_buy_price": 571.33,
      "overnight_buy_amount": 1428.35,
      "overnight_buy_quantity": 2,
      "day_buy_quantity": 5,
      "day_sell_value": 0.0,
      "day_sell_price": 0.0,
      "overnight_sell_amount": 0.0,
      "overnight_sell_quantity": 0,
      "day_sell_quantity": 0,
      "quantity": 7,
      "last_price": 589.75,
      "unrealised": 128.55,
      "realised": 0.0,
      "sell_value": 0.0,
      "trading_symbol": "SBIN",
      "close_price": 572.65,
      "buy_price": 571.33,
      "sell_price": 0.0
    },
    {
      "exchange": "NSE",
      "multiplier": 1.0,
      "value": 58300.0,
      "pnl": 350.0,
      "product": "MTF",
      "instrument_token": "NSE_EQ|INE002A01018",
      "average_price": 2915.0,
      "buy_value": 58300.0,
      "overnight_quantity": 20,
      "day_buy_value": 0.0,
      "day_buy_price": 0.0,
      "overnight_buy_amount": 58300.0,
      "overnight_buy_quantity": 20,
      "day_buy_quantity": 0,
      "day_sell_value": 0.0,
      "day_sell_price": 0.0,
      "overnight_sell_amount": 0.0,
      "overnight_sell_quantity": 0,
      "day_sell_quantity": 0,
      "quantity": 20,
      "last_price": 2932.5,
      "unrealised": 350.0,
      "realised": 0.0,
      "sell_value": 0.0,
      "trading_symbol": "RELIANCE",
      "close_price": 2920.75,
      "buy_price": 2915.0,
      "sell_price": 0.0
    }
  ]
}


Sample Code
Get MTF Positions
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v3/portfolio/mtf-positions'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.json())


Previous
Get Positions

Next
Convert Positions

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK






































































































Developer API
Portfolio
Portfolio
Convert Positions
On this page
PUT
/portfolio/convert-position
Convert Positions
API to convert your intraday positions into delivery trades or your margin trades into cash and carry, and vice versa. Position would be converted only if the required margin is available. Delivery holdings can be converted to Intraday positions only if it is purchased on the same day before the auto square off timing. Only simple order can be converted from Intraday to delivery, Special orders like CO cannot be converted from intraday to delivery.
Request
curl --location --request PUT 'https://api.upstox.com/v2/portfolio/convert-position' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}' \
--data '{
  "instrument_token": "NSE_EQ|INE528G01035",
  "new_product": "D",
  "old_product": "I",
  "transaction_type": "BUY",
  "quantity": 1
}'
For additional samples in various languages, please refer to the Sample code section on this page.
Request Body
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "status": "complete"
  }
}


Sample Code
Convert a position from intraday to delivery
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location --request PUT 'https://api.upstox.com/v2/portfolio/convert-position' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}' \
--data '{
  "instrument_token": "NSE_EQ|INE528G01035",
  "new_product": "D",
  "old_product": "I",
  "transaction_type": "BUY",
  "quantity": 1
}'
Convert a position from delivery to intraday
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location --request PUT 'https://api.upstox.com/v2/portfolio/convert-position' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}' \
--data '{
  "instrument_token": "NSE_EQ|INE528G01035",
  "new_product": "I",
  "old_product": "D",
  "transaction_type": "BUY",
  "quantity": 1
}'

Previous
Get MTF Positions

Next
Get Holdings

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK






































































































Developer API
Portfolio
Portfolio
Get Holdings
On this page
GET
/portfolio/long-term-holdings
Get Holdings
API to retrieve the long term holdings of the user. A Holding within a holdings portfolio remains in place without a predetermined time limit. It can only be withdrawn when it is divested, delisted, or subject to modifications dictated by the stock exchanges. In essence, the instruments housed in the portfolio are securely located within the user's DEMAT account, in strict compliance with the regulations.
Request
curl --location 'https://api.upstox.com/v2/portfolio/long-term-holdings' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
Response Body
{
  "status": "success",
  "data": [
    {
      "isin": "INE528G01035",
      "cnc_used_quantity": 0,
      "collateral_type": "WC",
      "company_name": "YES BANK LTD.",
      "haircut": 0.2,
      "product": "D",
      "quantity": 36,
      "trading_symbol": "YESBANK",
      "tradingsymbol": "YESBANK",
      "last_price": 17.05,
      "close_price": 17.05,
      "pnl": -61.2,
      "day_change": 0,
      "day_change_percentage": 0,
      "instrument_token": "NSE_EQ|INE528G01035",
      "average_price": 18.75,
      "collateral_quantity": 0,
      "collateral_update_quantity": 0,
      "t1_quantity": 0,
      "exchange": "NSE"
    },
    {
      "isin": "INE036A01016",
      "cnc_used_quantity": 0,
      "collateral_type": "WC",
      "company_name": "RELIANCE INFRASTRUCTURE LTD.",
      "haircut": 1,
      "product": "D",
      "quantity": 1,
      "trading_symbol": "RELINFRA",
      "tradingsymbol": "RELINFRA",
      "last_price": 174.85,
      "close_price": 169.2,
      "pnl": -17.7,
      "day_change": 0,
      "day_change_percentage": 0,
      "instrument_token": "NSE_EQ|INE036A01016",
      "average_price": 192.55,
      "collateral_quantity": 0,
      "collateral_update_quantity": 0,
      "t1_quantity": 0,
      "exchange": "NSE"
    }
  ]
}


Sample Code
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/portfolio/long-term-holdings'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.json())


Previous
Convert Positions

Next
Mutual Fund

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































Developer API
Portfolio
Trade Profit And Loss
Get Report Meta Data
On this page
GET
/trade/profit-loss/metadata
Get Report Meta Data
API to retrieve metadata for the trade-wise profit and loss report, including the total number of trades and the maximum page size to use when paginating the report.
Request
curl -X 'GET'
   'https://api.upstox.com/v2/trade/profit-loss/metadata?start_date=01-04-2022&emd_date=30-03-2023&segment=EQ&financial_year=2223'
 -H 'Content-Type: application/json'
 -H 'accept: application/json'
 -H 'Authorization: Bearer access_token'
Additional samples in various languages are available in the Sample Code section on this page.
Query Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "trades_count": 10,
    "page_size_limit": 5000
  }
}


Sample Code
A comprehensive set of examples is provided to illustrate various use cases and implementation scenarios for this API.
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/trade/profit-loss/metadata'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

params = {
    'from_date': '05-11-2023',
    'to_date': '19-12-2023',
    'segment': 'EQ',
    'financial_year': '2324'
}

response = requests.get(url, headers=headers, params=params)

print(response.status_code)
print(response.json())

Previous
Trade Profit And Loss

Next
Get Profit Loss Report

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































Developer API
Portfolio
Trade Profit And Loss
Get Profit Loss Report
On this page
GET
/trade/profit-loss/data
Get Profit Loss Report
API to fetch the trade-wise realised profit and loss report for a given segment and financial year, with per-trade details such as quantity, buy and sell prices, and amounts.
Request
curl --location 'https://api.upstox.com/v2/trade/profit-loss/data?from_date=05-11-2023&to_date=19-12-2023&segment=EQ&financial_year=2324&page_number=1&page_size=4' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Query Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": [
    {
      "quantity": 100,
      "isin": "INE256A01028",
      "scrip_name": "ZEE ENTER",
      "trade_type": "EQ",
      "buy_date": "14-09-2021",
      "buy_average": 12345.67,
      "sell_date": "14-09-2021",
      "sell_average": 12345.67,
      "buy_amount": 12345.67,
      "sell_amount": 12345.67
    }
  ],
  "metadata": {
    "page": {
      "page_number": 1,
      "page_size": 2
    }
  }
}


Sample Code
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/trade/profit-loss/data'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

params = {
    'from_date': '05-11-2023',
    'to_date': '19-12-2023',
    'segment': 'EQ',
    'financial_year': '2324',
    'page_number': '1',
    'page_size': '4'
}

response = requests.get(url, headers=headers, params=params)

print(response.status_code)
print(response.json())
Get profit loss report for futures and options segment
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/trade/profit-loss/data'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

params = {
    'from_date': '05-11-2023',
    'to_date': '19-12-2023',
    'segment': 'FO',
    'financial_year': '2324',
    'page_number': '1',
    'page_size': '4'
}

response = requests.get(url, headers=headers, params=params)

print(response.status_code)
print(response.json())

Previous
Get Report Meta Data

Next
Get Trades Charges

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































Developer API
Portfolio
Trade Profit And Loss
Get Trades Charges
On this page
GET
/trade/profit-loss/charges
Get Trades Charges
API to retrieve the charges incurred on trades for a given segment and financial year, with a detailed breakdown of brokerage, taxes, and other transaction charges.
Request
curl --location 'https://api.upstox.com/v2/trade/profit-loss/charges?from_date=05-11-2023&to_date=19-12-2023&segment=EQ&financial_year=2324' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Query Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "charges_breakdown": {
      "total": 154.23,
      "brokerage": 97.23,
      "taxes": {
        "gst": 20.93,
        "stt": 15,
        "stamp_duty": 2
      },
      "charges": {
        "transaction": 0.56,
        "clearing": 0,
        "ipft": null,
        "others": 0,
        "sebi_turnover": 0.01,
        "demat_transaction": 18.5
      }
    }
  }
}


Sample Code
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/trade/profit-loss/charges'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

params = {
    'from_date': '05-11-2023',
    'to_date': '19-12-2023',
    'segment': 'EQ',
    'financial_year': '2324'
}

response = requests.get(url, headers=headers, params=params)

print(response.status_code)
print(response.json())

Previous
Get Profit Loss Report

Next
Historical Data

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK













































































































Developer API
Market Data
Historical Data
Historical Candle Data V3
On this page
GET
/historical-candle/:instrument_key/:unit/:interval/:to_date/:from_date
Historical Candle Data V3
Compared to the standard Historical Candle Data API, API V3 allows users to retrieve data in custom time intervals for each unit (minutes, hours, days, weeks, and months), enabling more granular data control and improved flexibility for analysis. The response structure maintains consistency with the standard Historical Candle Data API format, facilitating seamless integration with existing applications and systems.
The API is designed to handle large volumes of data efficiently, ensuring quick response times even for extensive historical queries.
This API is particularly useful for traders and analysts who need to analyze historical price movements and trends in the financial markets.
The API offers OHLC (Open, High, Low, Close) data for instruments across multiple timeframes, with different historical availability and retrieval constraints based on the selected unit and interval as per the below table:
New Instruments
Global Index — Major global stock market indices such as GIFT NIFTY, Dow Jones, S&P, FTSE 100, and more. See Global Instruments for details and download the Global Instruments file for instrument keys.
Global Indicators — Economic and commodity indicators including USD INR, Oil (Brent), and Oil (WTI). See Global Instruments for details and download the Global Instruments file for instrument keys.
India VIX — The NSE Volatility Index, available using instrument key NSE_INDEX|India VIX.
Request
curl --location 'https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE848E01016/minutes/1/2025-01-02/2025-01-01' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.


Path Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "candles": [
      [
        "2025-01-01T00:00:00+05:30",
        53.1,
        53.95,
        51.6,
        52.05,
        235519861,
        0
      ],
      [
        "2025-02-01T00:00:00+05:30",
        50.35,
        56.85,
        49.35,
        52.8,
        1004998611,
        0
      ]
    ]
  }
}


Sample Code
Get data with a 1-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE848E01016/minutes/1/2025-01-02/2025-01-01' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 3-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE848E01016/minutes/3/2025-01-02/2025-01-01' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 15-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE848E01016/minutes/15/2025-01-04/2025-01-01' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 1-hour interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE848E01016/hours/1/2025-02-01/2025-01-01' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 4-hour interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE848E01016/hours/4/2025-02-01/2025-01-01' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a daily interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE848E01016/days/1/2025-03-01/2025-01-01' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a weekly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE848E01016/weeks/1/2025-01-01/2024-01-01' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a monthly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE848E01016/months/1/2025-01-01/2010-01-01' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

NOTE
Use the Intraday Candle Data API V3 to retrieve data specific to the current trading day with the wide range of units and intervals
It's important to note that if the retrieval record limit is exceeded, then the API will throw an error indicating that the request is invalid.
This V3 API provides additional custom interval options that are not available in the standard Historical Candle Data API

Previous
Historical Data

Next
Intraday Candle Data V3

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK













































































































Developer API
Market Data
Historical Data
Intraday Candle Data V3
On this page
GET
/historical-candle/intraday/:instrument_key/:unit/:interval
Intraday Candle Data V3
This API is an extended version of standard Intraday Candle Data API, which allows you to retrieve Open, High, Low, and Close (OHLC) values for the current trading day. It supports customizable time intervals across various units such as minutes, hours, days.
This API is particularly useful for traders and analysts who require detailed intraday data for technical analysis, backtesting, or algorithmic trading strategies. This V3 API provides additional custom interval options that are not available in the standard Intraday Candle Data API.
This API provides the following unit and interval options for intraday data:
New Instruments
Global Index — Major global stock market indices such as GIFT NIFTY, Dow Jones, S&P, FTSE 100, and more. See Global Instruments for details and download the Global Instruments file for instrument keys.
Global Indicators — Economic and commodity indicators including USD INR, Oil (Brent), and Oil (WTI). See Global Instruments for details and download the Global Instruments file for instrument keys.
India VIX — The NSE Volatility Index, available using instrument key NSE_INDEX|India VIX.
Request
curl --location 'https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7CINE848E01016/minutes/1' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Path Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "candles": [
      [
        "2025-01-12T15:15:00+05:30",
        2305.3,
        2307.05,
        2301,
        2304.65,
        559982,
        0
      ],
      [
        "2025-01-12T14:45:00+05:30",
        2309.1,
        2310.75,
        2305.25,
        2305.3,
        740124,
        0
      ]
    ]
  }
}


Sample Code
Get data with a 1-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7CINE848E01016/minutes/1' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 3-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7CINE848E01016/minutes/3' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 5-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7CINE848E01016/minutes/5' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 15-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7CINE848E01016/minutes/15' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 30-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7CINE848E01016/minutes/30' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 1-hour interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7CINE848E01016/hours/1' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 2-hour interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7CINE848E01016/hours/2' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get current day data
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7CINE848E01016/days/1' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'


Previous
Historical Candle Data V3

Next
Historical Candle Data

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK













































































































Developer API
Market Data
Historical Data
Historical Candle Data
On this page
GET
/historical-candle/:instrument_key/:interval/:to_date/:from_date
Historical Candle Data Deprecated
API to retrieve OHLC (Open, High, Low, Close) data for instruments spanning multiple timeframes. Historical data is available for the following time durations:
1-minute: Retrieve the candles from the final month leading up to the endDate.
30-minute: Retrieve the candles from the past year up to the endDate.
Daily: Retrieve data for the past year, concluding on the endDate.
Weekly: Retrieve data from the previous ten years, ending on the endDate.
Monthly: Retrieve data spanning the last ten years, up to the specified endDate.
Request
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13/2023-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.


Path Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "candles": [
      [
        "2023-10-01T00:00:00+05:30",
        53.1,
        53.95,
        51.6,
        52.05,
        235519861,
        0
      ],
      [
        "2023-09-01T00:00:00+05:30",
        50.35,
        56.85,
        49.35,
        52.8,
        1004998611,
        0
      ]
    ]
  }
}


Sample Code
Get historical candle data with a 1-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13/2023-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 30-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13/2023-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a daily interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19/2023-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a weekly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19/2023-07-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a monthly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19/2022-11-12' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'


Get historical candle data with a 1-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a 30-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a daily interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a weekly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get data with a monthly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
NOTE
Use the Intraday API to retrieve data specific to the current trading day.
One-minute and 30-minute candle data are accessible solely for the preceding six months.
It's important to note that instrument_key parameter accepts only a single identifier per request; comma-separated values or multiple identifiers are not supported.

Previous
Intraday Candle Data V3

Next
Intraday Candle Data

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK













































































































Developer API
Market Data
Historical Data
Intraday Candle Data
On this page
GET
/historical-candle/intraday/:instrument_key/:interval
Intraday Candle Data Deprecated
API to retrieve OHLC (Open, High, Low, Close) values for instruments during the current trading day. Data is accessible for 1-minute and 30-minute intervals from the beginning of the market session. For real-time candlestick updates, it is advisable to utilize the Market Update Stream.
Request
curl --location 'https://api.upstox.com/v2/historical-candle/intraday/NSE_EQ%7CINE848E01016/1minute' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Path Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "candles": [
      [
        "2023-10-19T15:15:00+05:30",
        2305.3,
        2307.05,
        2301,
        2304.65,
        559982,
        0
      ],
      [
        "2023-10-19T14:45:00+05:30",
        2309.1,
        2310.75,
        2305.25,
        2305.3,
        740124,
        0
      ]
    ]
  }
}


Sample Code
Get intraday candle data with a 1-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/intraday/NSE_EQ%7CINE848E01016/1minute' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get intraday candle data with a 30-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/historical-candle/intraday/NSE_EQ%7CINE848E01016/30minute' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
NOTE
It's important to note that instrument_key parameter accepts only a single identifier per request; comma-separated values or multiple identifiers are not supported.
A minor delay may be experienced in the delivery of the most recent candle data, attributable to CDN caching. For immediate access to the latest data, it is advisable to connect to the websocket endpoints.

Previous
Historical Candle Data

Next
Expired Instruments

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK



















































































































Developer API
Market Data
Market Quote
Full Market Quotes
On this page
GET
/market-quote/quotes
Full Market Quotes
API to retrieve the full market quotes for one or more instruments. Provides the complete market data snapshot of up to 500 instruments in one go. These snapshots are obtained directly from the exchanges at the time of request.
New Instruments
Global Index — Major global stock market indices such as GIFT NIFTY, Dow Jones, S&P, FTSE 100, and more. See Global Instruments for details and download the Global Instruments file for instrument keys.
India VIX — The NSE Volatility Index, available using instrument key NSE_INDEX|India VIX.
Request
curl --location 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Query Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "NSE_EQ:NHPC": {
      "ohlc": {
        "open": 53.4,
        "high": 53.8,
        "low": 51.75,
        "close": 52.05
      },
      "depth": {
        "buy": [
          {
            "quantity": 6917,
            "price": 52.05,
            "orders": 20
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          }
        ],
        "sell": [
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          },
          {
            "quantity": 0,
            "price": 0,
            "orders": 0
          }
        ]
      },
      "timestamp": "2023-10-19T05:21:51.099+05:30",
      "instrument_token": "NSE_EQ|INE848E01016",
      "symbol": "NHPC",
      "last_price": 52.04999923706055,
      "volume": 24123697,
      "average_price": 52.56,
      "oi": 0,
      "net_change": -1.0500000000000043,
      "total_buy_quantity": 6917,
      "total_sell_quantity": 0,
      "lower_circuit_limit": 42.5,
      "upper_circuit_limit": 63.7,
      "last_trade_time": "1697624972130",
      "oi_day_high": 0,
      "oi_day_low": 0
    }
  }
}


Sample Code
Get full market quote
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get full market quote for multiple instrument keys
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Market Quote

Next
OHLC Quotes V3

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK



















































































































Developer API
Market Data
Market Quote
OHLC Quotes V3
On this page
GET
/market-quote/ohlc
OHLC Quotes V3
This API retrieves Open, High, Low, Close (OHLC) quotes for one or more instruments. V3 introduces the following enhancements:
live_ohlc: Provides the current OHLC candle.
prev_ohlc: Delivers the previous minute's OHLC candle.
volume: Includes trading volume data.
ts: Returns the OHLC candle's start time.
New Instruments
Global Index — Major global stock market indices such as GIFT NIFTY, Dow Jones, S&P, FTSE 100, and more. See Global Instruments for details and download the Global Instruments file for instrument keys.
India VIX — The NSE Volatility Index, available using instrument key NSE_INDEX|India VIX.
Request
curl --location 'https://api.upstox.com/v3/market-quote/ohlc?instrument_key=NSE_EQ%7CINE669E01016&interval=1d' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Query Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "NSE_FO:NIFTY2543021600PE": {
      "last_price": 303.9,
      "instrument_token": "NSE_FO|51834",
      "prev_ohlc": {
        "open": 303.9,
        "high": 304.3,
        "low": 303.85,
        "close": 304.3,
        "volume": 300,
        "ts": 1744019880000
      },
      "live_ohlc": {
        "open": 304.45,
        "high": 304.45,
        "low": 302.75,
        "close": 303.9,
        "volume": 2250,
        "ts": 1744019940000
      }
    }
  }
}


Sample Code
Get ohlc (open, high, low, close) market quotes
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/market-quote/ohlc?instrument_key=NSE_EQ%7CINE669E01016&interval=1d' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get ohlc (open, high, low, close) market quotes for multiple instrument keys
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/market-quote/ohlc?instrument_key=NSE_EQ%7CINE669E01016%2CNSE_EQ%7CINE848E01016&interval=1d' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Full Market Quotes

Next
LTP Quotes V3

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK



















































































































Developer API
Market Data
Market Quote
LTP Quotes V3
On this page
GET
/market-quote/ltp
LTP Quotes V3
API provides LTP quotes for specified instruments. In V3, the response has been enhanced to include:
ltq: The quantity of the last traded transaction.
volume: The cumulative trading volume for the current day.
cp: The closing price from the previous trading day.
New Instruments
Global Index — Major global stock market indices such as GIFT NIFTY, Dow Jones, S&P, FTSE 100, and more. See Global Instruments for details and download the Global Instruments file for instrument keys.
India VIX — The NSE Volatility Index, available using instrument key NSE_INDEX|India VIX.
Request
curl --location 'https://api.upstox.com/v3/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.


Query Parameters
Responses
200
4XX
Response body
{
  "status": "success",
  "data": {
    "NSE_FO:NIFTY2543021600PE": {
      "last_price": 303.9,
      "instrument_token": "NSE_FO|51834",
      "ltq": 75,
      "volume": 170325,
      "cp": 29.0
    }
  }
}


Sample Code
Get ltp (last traded price) market quotes
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get ltp (last traded price) market quotes for multiple instruments keys
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
OHLC Quotes V3

Next
Option Greeks

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK



















































































































Developer API
Market Data
Market Quote
Option Greeks
On this page
GET
/market-quote/option-greek
Option Greek Fields
This API endpoint provides option Greek data for specified instruments. The response contains all fields required to construct an option chain, as well as the current day's total trading volume. This API supports a maximum of 50 instrument keys in a single request.
Request
curl --location 'https://api.upstox.com/v3/market-quote/option-greek?instrument_key=NSE_FO%7C43885' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.


Query Parameters
Responses
200
4XX
Response body
{
  "status": "success",
  "data": {
    "NSE_FO:NIFTY2540923000PE": {
      "last_price": 412.2,
      "instrument_token": "NSE_FO|43885",
      "ltq": 75,
      "volume": 3609600,
      "cp": 831.2,
      "iv": 0.33599853515625,
      "vega": 3.3899,
      "gamma": 0.0005,
      "theta": -51.848,
      "delta": -0.8081,
      "oi": 2476650
    }
  }
}


Sample Code
Get Option Greek fields
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/market-quote/option-greek?instrument_key=NSE_FO%7C43885' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get Option Greek fields for multiple instruments keys
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v3/market-quote/option-greek?instrument_key=NSE_FO%7C43885,NSE_FO|43886' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
LTP Quotes V3

Next
OHLC Quotes

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK



















































































































Developer API
Market Data
Market Quote
OHLC Quotes
On this page
GET
/market-quote/ohlc
OHLC Quotes Deprecated
API to retrieve the OHLC (Open, High, Low, Close) quotes for one or more instruments. Provides OHLC snapshots of up to 500 instruments in one go.
This API supports a maximum of 500 instrument keys in a single request. For a time interval of 1d, the API returns only the live_ohlc. Previous day OHLC data is available in Historical Candle Data.
Request
curl --location 'https://api.upstox.com/v2/market-quote/ohlc?instrument_key=NSE_EQ%7CINE669E01016&interval=1d' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Query Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "NSE_EQ:NHPC": {
      "ohlc": {
        "open": 53.4,
        "high": 53.8,
        "low": 51.75,
        "close": 52.05
      },
      "last_price": 52.05,
      "instrument_token": "NSE_EQ|INE848E01016"
    }
  }
}


Sample Code
Get ohlc (open, high, low, close) market quotes
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/market-quote/ohlc?instrument_key=NSE_EQ%7CINE669E01016&interval=1d' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get ohlc (open, high, low, close) market quotes for multiple instrument keys
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/market-quote/ohlc?instrument_key=NSE_EQ%7CINE669E01016%2CNSE_EQ%7CINE848E01016&interval=1d' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Option Greeks

Next
LTP Quotes

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK



















































































































Developer API
Market Data
Market Quote
LTP Quotes
On this page
GET
/market-quote/ltp
LTP Quotes Deprecated
API to retrieve the LTP quotes for one or more instruments. Provides LTPs of up to 500 instruments in one go. This API supports a maximum of 500 instrument keys in a single request.
Request
curl --location 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Query Parameters
Responses
200
4XX
Response body
{
  "status": "success",
  "data": {
    "NSE_EQ:NHPC": {
      "last_price": 52.05,
      "instrument_token": "NSE_EQ|INE848E01016"
    }
  }
}


Sample Code
Get ltp (last traded price) market quotes
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get ltp (last traded price) market quotes for multiple instruments keys
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_EQ%7CINE848E01016,NSE_EQ|INE669E01016' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
OHLC Quotes

Next
Option Chain

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK





















































































































Developer API
Market Data
Option Chain
Option Contracts
On this page
GET
/option/contract
Option Contracts
API to retrieve option contracts for an underlying symbol. It also supports an optional parameter to fetch option contracts for a specific expiry date.
Request
curl --location 'https://api.upstox.com/v2/option/contract?instrument_key=NSE_INDEX%7CNifty%2050' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Query Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": [
    {
      "name": "NIFTY",
      "segment": "NSE_FO",
      "exchange": "NSE",
      "expiry": "2024-02-15",
      "instrument_key": "NSE_FO|37590",
      "exchange_token": "37590",
      "trading_symbol": "NIFTY 19650 CE 15 FEB 24",
      "tick_size": 5,
      "lot_size": 50,
      "instrument_type": "CE",
      "freeze_quantity": 1800,
      "underlying_key": "NSE_INDEX|Nifty 50",
      "underlying_type": "INDEX",
      "underlying_symbol": "NIFTY",
      "strike_price": 19650,
      "minimum_lot": 50,
      "weekly": true
    },
    {
      "name": "NIFTY",
      "segment": "NSE_FO",
      "exchange": "NSE",
      "expiry": "2024-02-15",
      "instrument_key": "NSE_FO|37668",
      "exchange_token": "37668",
      "trading_symbol": "NIFTY 19700 CE 15 FEB 24",
      "tick_size": 5,
      "lot_size": 50,
      "instrument_type": "CE",
      "freeze_quantity": 1800,
      "underlying_key": "NSE_INDEX|Nifty 50",
      "underlying_type": "INDEX",
      "underlying_symbol": "NIFTY",
      "strike_price": 19700,
      "minimum_lot": 50,
      "weekly": true
    }
  ]
}


Sample Code
Get option contracts of an instrument key
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/option/contract?instrument_key=NSE_INDEX%7CNifty%2050' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Get option contracts of an instrument key with expiry date
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/option/contract?instrument_key=NSE_INDEX%7CNifty%2050&expiry_date=2024-03-28' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Option Chain

Next
Put/Call Option chain

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK





















































































































Developer API
Market Data
Option Chain
Put/Call Option chain
On this page
GET
/option/chain
Put/Call Option Chain
API to retrieve put/call option chain for an underlying symbol for a specific expiry date. The Put/Call Option chain is currently not available for the MCX Exchange.
Request
curl --location 'https://api.upstox.com/v2/option/chain?instrument_key=NSE_INDEX%7CNifty%2050&expiry_date=2024-03-28' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
Additional samples in various languages are available in the Sample Code section on this page.
Query Parameters

Responses
200
4XX
Response Body
{
  "status": "success",
  "data": [
    {
      "expiry": "2025-02-13",
      "pcr": 7515.3,
      "strike_price": 21100,
      "underlying_key": "NSE_INDEX|Nifty 50",
      "underlying_spot_price": 22976.2,
      "call_options": {
        "instrument_key": "NSE_FO|51059",
        "market_data": {
          "ltp": 2449.9,
          "volume": 0,
          "oi": 750,
          "close_price": 2449.9,
          "bid_price": 1856.65,
          "bid_qty": 1125,
          "ask_price": 1941.65,
          "ask_qty": 1125,
          "prev_oi": 1500
        },
        "option_greeks": {
          "vega": 4.1731,
          "theta": -472.8941,
          "gamma": 0.0001,
          "delta": 0.743,
          "iv": 262.31,
          "pop": 40.56
        }
      },
      "put_options": {
        "instrument_key": "NSE_FO|51060",
        "market_data": {
          "ltp": 0.3,
          "volume": 22315725,
          "oi": 5636475,
          "close_price": 0.35,
          "bid_price": 0.3,
          "bid_qty": 1979400,
          "ask_price": 0.35,
          "ask_qty": 2152500,
          "prev_oi": 5797500
        },
        "option_greeks": {
          "vega": 0.0568,
          "theta": -1.2461,
          "gamma": 0,
          "delta": -0.0013,
          "iv": 50.78,
          "pop": 0.15
        }
      }
    }
  ]
}
Option Market Data
Option Greek Data


Sample Code
Get put/call option chain
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/option/chain'
params = {
    'instrument_key': 'NSE_INDEX|Nifty 50',
    'expiry_date': '2024-03-28'
}
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, params=params, headers=headers)

print(response.json())

Previous
Option Contracts

Next
Market Information

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Get Options Smartlist
On this page
GET
/market/smartlist/options
Options Smartlist
API for retrieving a ranked list of options contracts filtered by asset type and category. Each entry includes the instrument key, live price data, and the category-specific metric used for ranking.
A smartlist is a curated, real-time ranked list of instruments grouped by a specific market signal — such as highest traded value, biggest open interest change, or strongest implied volatility move. Instead of scanning the entire options market, you get a focused subset of contracts that are most relevant to a given category at that moment.
For more information on how the options smartlist feature works, see the Upstox community post.
Request
curl --location 'https://api.upstox.com/v2/market/smartlist/options?asset_type=INDEX&category=TOP_TRADED&page_number=1&page_size=20' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.


Query Parameters
Accepted category values by asset_type:
The metric_key field in the response indicates which metric was used for ranking:
Responses
200
4XX
Response body
{
  "status": "success",
  "data": {
    "asset_type": "INDEX",
    "category": "TOP_TRADED",
    "time_stamp": 1780041069287,
    "metric_key": "total_traded_value",
    "smartlist": [
      {
        "instrument_key": "NSE_FO|57047",
        "price": {
          "current": 177.4,
          "close_price": 125.5,
          "change_abs": 51.9,
          "change_pct": 41.35
        },
        "metric": {
          "current": 53889598074,
          "previous": 4351865287721.25,
          "change_abs": -4297975689647.25,
          "change_pct": -98.76
        }
      },
      {
        "instrument_key": "NSE_FO|57051",
        "price": {
          "current": 241.65,
          "close_price": 172.35,
          "change_abs": 69.3,
          "change_pct": 40.21
        },
        "metric": {
          "current": 36473443958.25,
          "previous": 2391714654137.25,
          "change_abs": -2355241210179,
          "change_pct": -98.48
        }
      },
      {
        "instrument_key": "NSE_FO|57049",
        "price": {
          "current": 208.15,
          "close_price": 148,
          "change_abs": 60.15,
          "change_pct": 40.64
        },
        "metric": {
          "current": 29500456316.5,
          "previous": 2171128196155.75,
          "change_abs": -2141627739839.25,
          "change_pct": -98.64
        }
      }
    ],
    "page_number": 1,
    "page_size": 3,
    "total_pages": 3354
  }
}
For UNDER_5000 and UNDER_10000 categories, metric.previous, metric.change_abs, and metric.change_pct are returned as null — no previous metric value is available for these categories.


Sample Code
Get options smartlist
Curl
Python
Node.js
Java
PHP
curl --location 'https://api.upstox.com/v2/market/smartlist/options?asset_type=INDEX&category=TOP_TRADED&page_number=1&page_size=20' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Market Information

Next
Get Futures Smartlist

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Get Futures Smartlist
On this page
GET
/market/smartlist/futures
Futures Smartlist
API for retrieving a ranked list of futures contracts filtered by asset type and category. Each entry includes the instrument key, live price data, and the category-specific metric used for ranking.
A smartlist is a curated, real-time ranked list of instruments grouped by a specific market signal — such as highest traded value, biggest open interest change, or largest premium/discount. Instead of scanning the entire futures market, you get a focused subset of contracts that are most relevant to a given category at that moment.
Request
curl --location 'https://api.upstox.com/v2/market/smartlist/futures?asset_type=INDEX&category=TOP_TRADED&page_number=1&page_size=20' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.


Query Parameters
Accepted category values by asset_type:
The metric_key field in the response indicates which metric was used for ranking:
Responses
200
4XX
Response body
{
    "status": "success",
    "data": {
        "asset_type": "INDEX",
        "category": "TOP_TRADED",
        "time_stamp": 1780045636752,
        "metric_key": "total_traded_value",
        "smartlist": [
            {
                "instrument_key": "NSE_FO|62329",
                "price": {
                    "current": 23867.0,
                    "close_price": 23996.7,
                    "change_abs": -129.70,
                    "change_pct": -0.54
                },
                "metric": {
                    "current": 132094775540,
                    "previous": 69295823909,
                    "change_abs": 62798951631.00,
                    "change_pct": 90.62
                }
            },
            {
                "instrument_key": "NSE_FO|62326",
                "price": {
                    "current": 54970.0,
                    "close_price": 55207.0,
                    "change_abs": -237.00,
                    "change_pct": -0.43
                },
                "metric": {
                    "current": 45591018600,
                    "previous": 43236361746,
                    "change_abs": 2354656854.00,
                    "change_pct": 5.45
                }
            },
            {
                "instrument_key": "NSE_FO|61093",
                "price": {
                    "current": 23977.8,
                    "close_price": 24089.6,
                    "change_abs": -111.80,
                    "change_pct": -0.46
                },
                "metric": {
                    "current": 5752633887,
                    "previous": 4917306790.5,
                    "change_abs": 835327096.50,
                    "change_pct": 16.99
                }
            }
        ],
        "page_number": 1,
        "page_size": 3,
        "total_pages": 9
    }
}


Sample Code
Get futures smartlist
Curl
Python
Node.js
Java
PHP
curl --location 'https://api.upstox.com/v2/market/smartlist/futures?asset_type=INDEX&category=TOP_TRADED&page_number=1&page_size=20' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Get Options Smartlist

Next
Get MTF Smartlist

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Get FII Data
On this page
GET
/market/fii
FII Activity Data
API for retrieving Foreign Institutional Investor (FII) activity for a specified market segment and interval. It accepts the data type, interval, and an optional start date, and returns buy/sell amounts, contracts, open interest, and long/short position breakdowns across index futures, stock futures, and options segments. Data is available from 1st April 2026 onwards.
Daily (1D) — up to 30 trading days of data per request.
Monthly (1M) — up to 12 months of data per request (data collection started from 1st April 2026; the available range will grow as more months are recorded).
Request
curl --location 'https://api.upstox.com/v2/market/fii?data_type=NSE_FO%7CSTOCK_FUTURES&data_type=NSE_FO%7CINDEX_OPTIONS&interval=1D' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.


Query Parameters
Accepted data_type values — pass one or more segments to retrieve activity data for each independently:
NSE_FO|INDEX_FUTURES
NSE_FO|STOCK_FUTURES
NSE_FO|INDEX_OPTIONS
NSE_FO|STOCK_OPTIONS
NSE_EQ|CASH
Responses
200
4XX
Response body
{
    "status": "success",
    "data": {
        "NSE_FO|STOCK_FUTURES": [
            {
                "time_stamp": 1777487400000,
                "buy_amount": 23109.75,
                "sell_amount": 24642.52,
                "buy_contracts": 353981,
                "sell_contracts": 384079,
                "oi_contracts": 7245154,
                "oi_amount": 452650.0,
                "total_long_contracts": 4021980,
                "total_short_contracts": 3223174,
                "total_call_long_contracts": 0,
                "total_put_long_contracts": 0,
                "total_call_short_contracts": 0,
                "total_put_short_contracts": 0
            },
            {
                "time_stamp": 1777401000000,
                "buy_amount": 21593.35,
                "sell_amount": 21252.58,
                "buy_contracts": 327164,
                "sell_contracts": 318686,
                "oi_contracts": 7237618,
                "oi_amount": 456065.1,
                "total_long_contracts": 4033261,
                "total_short_contracts": 3204357,
                "total_call_long_contracts": 0,
                "total_put_long_contracts": 0,
                "total_call_short_contracts": 0,
                "total_put_short_contracts": 0
            }
        ],
        "NSE_FO|INDEX_OPTIONS": [
            {
                "time_stamp": 1777487400000,
                "buy_amount": 797967.36,
                "sell_amount": 794438.53,
                "buy_contracts": 5094129,
                "sell_contracts": 5072195,
                "oi_contracts": 1995796,
                "oi_amount": 313760.14,
                "total_long_contracts": 0,
                "total_short_contracts": 0,
                "total_call_long_contracts": 351772,
                "total_put_long_contracts": 715640,
                "total_call_short_contracts": 572110,
                "total_put_short_contracts": 356275
            },
            {
                "time_stamp": 1777401000000,
                "buy_amount": 579943.55,
                "sell_amount": 583822.61,
                "buy_contracts": 3659192,
                "sell_contracts": 3683793,
                "oi_contracts": 1776287,
                "oi_amount": 281482.39,
                "total_long_contracts": 0,
                "total_short_contracts": 0,
                "total_call_long_contracts": 293574,
                "total_put_long_contracts": 653116,
                "total_call_short_contracts": 509632,
                "total_put_short_contracts": 319965
            }
        ]
    }
}


Sample Code
Get FII data
Curl
Python
Node.js
Java
PHP
curl --location 'https://api.upstox.com/v2/market/fii?data_type=NSE_FO%7CSTOCK_FUTURES&data_type=NSE_FO%7CINDEX_OPTIONS&interval=1D' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Get MTF Smartlist

Next
Get DII Data

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Get DII Data
On this page
GET
/market/dii
DII Activity Data
API for retrieving Domestic Institutional Investor (DII) activity data. It accepts the data type, interval, and an optional start date, and returns buy/sell amounts for domestic institutional flows in the equities market. Data is available from 1st April 2026 onwards.
Daily (1D) — up to 30 trading days of data per request.
Monthly (1M) — up to 12 months of data per request (data collection started from 1st April 2026; the available range will grow as more months are recorded).
Request
curl --location 'https://api.upstox.com/v2/market/dii?data_type=NSE_EQ%7CCASH&interval=1D' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.


Query Parameters
Accepted data_type value — DII data is currently available only for the NSE equity cash segment:
NSE_EQ|CASH
Responses
200
4XX
Response body
{
  "status": "success",
  "data": {
    "NSE_EQ|CASH": [
      {
        "time_stamp": 1746633600000,
        "buy_amount": 8523456789.0,
        "sell_amount": 7234567890.5,
        "buy_contracts": 0,
        "sell_contracts": 0,
        "oi_contracts": 0,
        "oi_amount": 0.0,
        "total_long_contracts": 0,
        "total_short_contracts": 0,
        "total_call_long_contracts": 0,
        "total_put_long_contracts": 0,
        "total_call_short_contracts": 0,
        "total_put_short_contracts": 0
      }
    ]
  }
}


Sample Code
Get DII data
Curl
Python
Node.js
Java
PHP
curl --location 'https://api.upstox.com/v2/market/dii?data_type=NSE_EQ%7CCASH&interval=1D' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Get FII Data

Next
Get OI

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Get OI
On this page
GET
/market/oi
Open Interest (OI) Data
API for retrieving Open Interest data across all strike prices for an underlying asset on a given expiry and date. It accepts the instrument key, expiry, and date, and returns aggregate call and put OI totals along with a per-strike breakdown of call OI and put OI.
Request
curl --location 'https://api.upstox.com/v2/market/oi?instrument_key=NSE_INDEX%7CNifty%2050&expiry=2026-05-29&date=2026-05-07' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.


Query Parameters
Responses
200
4XX
Response body
{
  "status": "success",
  "data": {
    "total_puts": 12500000,
    "total_calls": 9800000,
    "spot_closing_price": 24450.75,
    "expiry": "2026-05-29",
    "call_put_oi_data_list": [
      {
        "call_oi": 450000,
        "put_oi": 680000,
        "strike_price": 24000.0
      },
      {
        "call_oi": 1200000,
        "put_oi": 950000,
        "strike_price": 24500.0
      }
    ]
  }
}


Sample Code
Get OI data
Curl
Python
Node.js
Java
PHP
curl --location 'https://api.upstox.com/v2/market/oi?instrument_key=NSE_INDEX%7CNifty%2050&expiry=2026-05-29&date=2026-05-07' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Get DII Data

Next
Get Change in OI

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Get Change in OI
On this page
GET
/market/change-oi
Change in Open Interest (OI)
API for retrieving the change in Open Interest per strike price for an underlying asset over a specified number of days. It accepts the instrument key, expiry, date, and interval, and returns the net OI change at each strike for both calls and puts — positive values indicate new positions being built, negative values indicate unwinding.
Request
curl --location 'https://api.upstox.com/v2/market/change-oi?instrument_key=NSE_INDEX%7CNifty%2050&expiry=2026-05-29&date=2026-05-07&interval=2' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.


Query Parameters
Responses
200
4XX
Response body
{
  "status": "success",
  "data": {
    "total_put_change_oi": 2500000,
    "total_call_change_oi": -1800000,
    "spot_closing_price": 24450.75,
    "expiry": "2026-05-29",
    "call_put_oi_data_list": [
      {
        "strike_price": 24000.0,
        "call_change_oi": -120000,
        "put_change_oi": 350000
      },
      {
        "strike_price": 24500.0,
        "call_change_oi": 280000,
        "put_change_oi": -150000
      }
    ]
  }
}


Sample Code
Get Change in OI data
Curl
Python
Node.js
Java
PHP
curl --location 'https://api.upstox.com/v2/market/change-oi?instrument_key=NSE_INDEX%7CNifty%2050&expiry=2026-05-29&date=2026-05-07&interval=2' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Get OI

Next
Get Max Pain

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Get Max Pain
On this page
GET
/market/max-pain
Max Pain
API for retrieving the Max Pain strike price for an underlying asset on a given expiry and date. It accepts the instrument key, expiry, date, and bucket interval, and returns the max pain level for the requested date along with spot price insights at each interval.
Request
curl --location 'https://api.upstox.com/v2/market/max-pain?instrument_key=NSE_INDEX%7CNifty%2050&expiry=2026-05-29&date=2026-05-07&bucket_interval=60' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.


Query Parameters
The bucket_interval parameter controls the granularity of the intraday insights array — it defines the gap in minutes between consecutive data points. For example, bucket_interval=60 returns one data point per hour starting from market open (09:15, 10:15, 11:15, ..., 15:15).
Responses
200
4XX
Response body
{
    "status": "success",
    "data": {
        "instrument_key": "NSE_INDEX|Nifty 50",
        "expiry_date": "19-05-2026",
        "max_pain": 24050.0,
        "spot_closing_price": 24044.35,
        "insights": [
            {
                "max_pain": 24250.0,
                "spot_price": 23955.0,
                "time": "09:15"
            },
            {
                "max_pain": 24100.0,
                "spot_price": 23829.65,
                "time": "10:15"
            },
            {
                "max_pain": 24000.0,
                "spot_price": 23800.0,
                "time": "11:15"
            },
            {
                "max_pain": 24000.0,
                "spot_price": 23905.75,
                "time": "12:15"
            },
            {
                "max_pain": 24000.0,
                "spot_price": 23950.65,
                "time": "13:15"
            },
            {
                "max_pain": 24050.0,
                "spot_price": 24028.5,
                "time": "14:15"
            },
            {
                "max_pain": 24050.0,
                "spot_price": 23988.3,
                "time": "15:15"
            }
        ]
    }
}


Sample Code
Get Max Pain data
Curl
Python
Node.js
Java
PHP
curl --location 'https://api.upstox.com/v2/market/max-pain?instrument_key=NSE_INDEX%7CNifty%2050&expiry=2026-05-29&date=2026-05-07&bucket_interval=60' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Get Change in OI

Next
Get PCR

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Get PCR
On this page
GET
/market/pcr
Put-Call Ratio (PCR)
API for retrieving the Put-Call Ratio for an underlying asset on a given expiry and date. It accepts the instrument key, expiry, date, and bucket interval, and returns the PCR for the requested date along with spot price insights at each interval.
Request
curl --location 'https://api.upstox.com/v2/market/pcr?instrument_key=NSE_INDEX%7CNifty%2050&expiry=2026-05-29&date=2026-05-07&bucket_interval=60' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.


Query Parameters
The bucket_interval parameter controls the granularity of the intraday insights array — it defines the gap in minutes between consecutive data points. For example, bucket_interval=60 returns one data point per hour starting from market open (09:15, 10:15, 11:15, ..., 15:15).
Responses
200
4XX
Response body
{
    "status": "success",
    "data": {
        "instrument_key": "NSE_INDEX|Nifty 50",
        "expiry_date": "19-05-2026",
        "pcr": 0.6162626197672175,
        "spot_closing_price": 24044.35,
        "insights": [
            {
                "pcr": 0.6440030253572708,
                "spot_price": 23955.0,
                "time": "09:15"
            },
            {
                "pcr": 0.6188192668371697,
                "spot_price": 23829.65,
                "time": "10:15"
            },
            {
                "pcr": 0.6011564491753729,
                "spot_price": 23800.0,
                "time": "11:15"
            },
            {
                "pcr": 0.6114701925916205,
                "spot_price": 23905.75,
                "time": "12:15"
            },
            {
                "pcr": 0.6311270125223614,
                "spot_price": 23950.65,
                "time": "13:15"
            },
            {
                "pcr": 0.6493306043015804,
                "spot_price": 24028.5,
                "time": "14:15"
            },
            {
                "pcr": 0.652457692695892,
                "spot_price": 23988.3,
                "time": "15:15"
            }
        ]
    }
}


Sample Code
Get PCR data
Curl
Python
Node.js
Java
PHP
curl --location 'https://api.upstox.com/v2/market/pcr?instrument_key=NSE_INDEX%7CNifty%2050&expiry=2026-05-29&date=2026-05-07&bucket_interval=60' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Get Max Pain

Next
Market Holidays

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Market Holidays
On this page
GET
/market/holidays
Market Holidays
API to retrieve holidays for the current year. It also supports an optional parameter to fetch holiday details for a specific date.
Path Parameters
Request
curl --location 'https://api.upstox.com/v2/market/holidays' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
Response Body
{
  "status": "success",
  "data": [
    {
      "date": "2024-01-01",
      "description": "New Year Day",
      "holiday_type": "TRADING_HOLIDAY",
      "closed_exchanges": [],
      "open_exchanges": [
        {
          "exchange": "MCX",
          "start_time": 1704079800000,
          "end_time": 1704108600000
        },
        {
          "exchange": "NSE",
          "start_time": 1704080700000,
          "end_time": 1704103200000
        },
        {
          "exchange": "NFO",
          "start_time": 1704080700000,
          "end_time": 1704103200000
        },
        {
          "exchange": "CDS",
          "start_time": 1704079800000,
          "end_time": 1704108600000
        },
        {
          "exchange": "BSE",
          "start_time": 1704080700000,
          "end_time": 1704103200000
        },
        {
          "exchange": "BCD",
          "start_time": 1704079800000,
          "end_time": 1704108600000
        },
        {
          "exchange": "BFO",
          "start_time": 1704080700000,
          "end_time": 1704103200000
        }
      ]
    },
    {
      "date": "2024-01-20",
      "description": "Special DR Trading",
      "holiday_type": "TRADING_HOLIDAY",
      "closed_exchanges": ["MCX", "CDS", "BCD"],
      "open_exchanges": [
        {
          "exchange": "NSE",
          "start_time": 1705722300000,
          "end_time": 1705734000000
        },
        {
          "exchange": "NFO",
          "start_time": 1705722300000,
          "end_time": 1705734000000
        },
        {
          "exchange": "BSE",
          "start_time": 1705722300000,
          "end_time": 1705734000000
        },
        {
          "exchange": "BFO",
          "start_time": 1705722300000,
          "end_time": 1705734000000
        }
      ]
    },
    {
      "date": "2024-01-26",
      "description": "Republic Day",
      "holiday_type": "TRADING_HOLIDAY",
      "closed_exchanges": ["NFO", "CDS", "BSE", "BCD", "MCX", "NSE", "BFO"],
      "open_exchanges": []
    }
  ]
}


Sample Code
Get market holidays for current year
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/market/holidays' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json'
Get market holiday status of a date
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
curl --location 'https://api.upstox.com/v2/market/holidays/2024-01-22' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'

Previous
Get PCR

Next
Market Timings

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Market Timings
On this page
GET
/market/timings/:date
Market Timings
API to retrieve the market timings for each exchange for a particular date.
Request
curl --location 'https://api.upstox.com/v2/market/timings/2024-01-22' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Path Parameters
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": [
    {
      "exchange": "MCX",
      "start_time": 1704079800000,
      "end_time": 1704108600000
    },
    {
      "exchange": "NSE",
      "start_time": 1704080700000,
      "end_time": 1704103200000
    },
    {
      "exchange": "NFO",
      "start_time": 1704080700000,
      "end_time": 1704103200000
    },
    {
      "exchange": "CDS",
      "start_time": 1704079800000,
      "end_time": 1704108600000
    },
    {
      "exchange": "BSE",
      "start_time": 1704080700000,
      "end_time": 1704103200000
    },
    {
      "exchange": "BCD",
      "start_time": 1704079800000,
      "end_time": 1704108600000
    },
    {
      "exchange": "BFO",
      "start_time": 1704080700000,
      "end_time": 1704103200000
    }
  ]
}


Sample Code
Get market timings of a date
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/market/timings/2024-01-22'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()
    # Process the JSON response
    print(data)
else:
    print("Failed to retrieve data. Status code:", response.status_code)

Previous
Market Holidays

Next
Exchange Status

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

































































































































Developer API
Market Data
Market Information
Exchange Status
On this page
GET
/market/status/:exchange
Exchange Status
API to retrieve the market status for a particular exchange.
Path Parameters
Request
curl --location 'https://api.upstox.com/v2/market/status/NSE' \
--header 'Content-Type: application/json' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "exchange": "NSE",
    "status": "NORMAL_OPEN",
    "last_updated": 1705549500000
  }
}


Sample Code
Get market status for a particular exchange
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
import requests

url = 'https://api.upstox.com/v2/market/status/NSE'
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)

print(response.json())

Previous
Market Timings

Next
Fundamentals

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































































Developer API
Market Data
Fundamentals
Get Company Profile
On this page
GET
/fundamentals/:isin/profile
Get Company Profile
API to retrieve the company profile for a given ISIN. The response includes a business description, sector classification, and sector market capitalisation in both INR and USD.
Path Parameters
Request
curl --location 'https://api.upstox.com/v2/fundamentals/INE002A01018/profile' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "company_profile": "Reliance Industries Limited is engaged in the activities of hydrocarbon exploration and production, petroleum refining and marketing, petrochemicals, advanced materials and composites, renewables, retail and digital services.",
    "sector": "Refineries",
    "sector_market_cap_inr": {
      "value": 1942866.05,
      "unit": "crore",
      "formatted": "1,942,866.05 Cr"
    },
    "sector_market_cap_usd": {
      "value": 215.87,
      "unit": "billion",
      "formatted": "$215.87B"
    }
  }
}


Sample Code
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/fundamentals/INE002A01018/profile'
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)
print(response.json())

Previous
Fundamentals

Next
Get Balance Sheet

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































































Developer API
Market Data
Fundamentals
Get Balance Sheet
On this page
GET
/fundamentals/:isin/balance-sheet
Get Balance Sheet
API to retrieve the historical balance sheet data for a company identified by its ISIN. The response contains total assets and total liabilities across multiple reporting periods, and can be filtered by statement type (consolidated or standalone). All monetary values are in Indian Rupees (Crore).
Path Parameters
Query Parameters
Request
curl --location 'https://api.upstox.com/v2/fundamentals/INE002A01018/balance-sheet?type=consolidated&fs=true' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "type": "consolidated",
    "time_period": "yearly",
    "units_in": "crore",
    "history": [
      { "total_asset": 1950121, "total_liability": 940495, "period": "Mar 2025" },
      { "total_asset": 1755986, "total_liability": 830198, "period": "Mar 2024" },
      { "total_asset": 1607431, "total_liability": 778550, "period": "Mar 2023" },
      { "total_asset": 1499665, "total_liability": 610681, "period": "Mar 2022" }
    ],
    "full_statement": [
      {
        "particular": "Non-Current Assets",
        "history": [
          { "period": "Mar 2025", "value": 1450851 },
          { "period": "Mar 2024", "value": 1285886 },
          { "period": "Mar 2023", "value": 1182135 },
          { "period": "Mar 2022", "value": 1152646 }
        ]
      },
      {
        "particular": "Current Assets",
        "history": [
          { "period": "Mar 2025", "value": 499270 },
          { "period": "Mar 2024", "value": 470100 },
          { "period": "Mar 2023", "value": 425296 },
          { "period": "Mar 2022", "value": 347019 }
        ]
      },
      {
        "particular": "Total Assets",
        "history": [
          { "period": "Mar 2025", "value": 1950121 },
          { "period": "Mar 2024", "value": 1755986 },
          { "period": "Mar 2023", "value": 1607431 },
          { "period": "Mar 2022", "value": 1499665 }
        ]
      },
      {
        "particular": "Current Liabilities",
        "history": [
          { "period": "Mar 2025", "value": 453737 },
          { "period": "Mar 2024", "value": 397367 },
          { "period": "Mar 2023", "value": 395743 },
          { "period": "Mar 2022", "value": 308662 }
        ]
      },
      {
        "particular": "Net Current Asset",
        "history": [
          { "period": "Mar 2025", "value": 45533 },
          { "period": "Mar 2024", "value": 72733 },
          { "period": "Mar 2023", "value": 29553 },
          { "period": "Mar 2022", "value": 38357 }
        ]
      },
      {
        "particular": "Non-Current Liabilities",
        "history": [
          { "period": "Mar 2025", "value": 486758 },
          { "period": "Mar 2024", "value": 432831 },
          { "period": "Mar 2023", "value": 382807 },
          { "period": "Mar 2022", "value": 302019 }
        ]
      },
      {
        "particular": "Equity Capital",
        "history": [
          { "period": "Mar 2025", "value": 1009626 },
          { "period": "Mar 2024", "value": 925788 },
          { "period": "Mar 2023", "value": 828881 },
          { "period": "Mar 2022", "value": 888984 }
        ]
      },
      {
        "particular": "Total Equity & Liabilities",
        "history": [
          { "period": "Mar 2025", "value": 1950121 },
          { "period": "Mar 2024", "value": 1755986 },
          { "period": "Mar 2023", "value": 1607431 },
          { "period": "Mar 2022", "value": 1499665 }
        ]
      }
    ]
  }
}


Sample Code
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/fundamentals/INE002A01018/balance-sheet'
params = {
    'type': 'consolidated',
    'fs': 'true'
}
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, params=params, headers=headers)
print(response.json())

Previous
Get Company Profile

Next
Get Cash Flow

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































































Developer API
Market Data
Fundamentals
Get Cash Flow
On this page
GET
/fundamentals/:isin/cash-flow
Get Cash Flow
API to retrieve the historical cash flow statements for a company identified by its ISIN. The response groups cash flows by category (Operating, Investing, Financing), each with historical values and period-over-period percentage changes. You can filter by statement type (consolidated or standalone). All monetary values are in Indian Rupees (Crore).
Path Parameters
Query Parameters
Request
curl --location 'https://api.upstox.com/v2/fundamentals/INE002A01018/cash-flow?type=consolidated&fs=true' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "type": "consolidated",
    "time_period": "yearly",
    "units_in": "crore",
    "cash_flow": [
      {
        "category": "operating",
        "history": [
          { "value": 178703, "period": "Mar 2025", "change": "+12.54%" },
          { "value": 158788, "period": "Mar 2024", "change": "+38.04%" },
          { "value": 115032, "period": "Mar 2023", "change": "+3.96%" },
          { "value": 110654, "period": "Mar 2022" }
        ]
      },
      {
        "category": "investing",
        "history": [
          { "value": -137535, "period": "Mar 2025", "change": "-21.09%" },
          { "value": -113581, "period": "Mar 2024", "change": "-24.49%" },
          { "value": -91235, "period": "Mar 2023", "change": "+17.14%" },
          { "value": -110103, "period": "Mar 2022" }
        ]
      },
      {
        "category": "financing",
        "history": [
          { "value": -31891, "period": "Mar 2025", "change": "-91.58%" },
          { "value": -16646, "period": "Mar 2024", "change": "-259.22%" },
          { "value": 10455, "period": "Mar 2023", "change": "-39.53%" },
          { "value": 17289, "period": "Mar 2022" }
        ]
      }
    ],
    "full_statement": [
      {
        "particular": "Profit before tax",
        "history": [
          { "period": "Mar 2025", "value": 106017 },
          { "period": "Mar 2024", "value": 104340 },
          { "period": "Mar 2023", "value": 94801 },
          { "period": "Mar 2022", "value": 84142 }
        ]
      },
      {
        "particular": "Income before WC changes",
        "history": [
          { "period": "Mar 2025", "value": 166904 },
          { "period": "Mar 2024", "value": 164383 },
          { "period": "Mar 2023", "value": 140963 },
          { "period": "Mar 2022", "value": 113726 }
        ]
      },
      {
        "particular": "Change in Assets",
        "history": [
          { "period": "Mar 2025", "value": -14703 },
          { "period": "Mar 2024", "value": -28430 },
          { "period": "Mar 2023", "value": -19034 },
          { "period": "Mar 2022", "value": -39163 }
        ]
      },
      {
        "particular": "Change in Liabilities",
        "history": [
          { "period": "Mar 2025", "value": 38427 },
          { "period": "Mar 2024", "value": 34796 },
          { "period": "Mar 2023", "value": -600 },
          { "period": "Mar 2022", "value": 39888 }
        ]
      },
      {
        "particular": "Change in WC",
        "history": [
          { "period": "Mar 2025", "value": 23724 },
          { "period": "Mar 2024", "value": 6366 },
          { "period": "Mar 2023", "value": -19634 },
          { "period": "Mar 2022", "value": 725 }
        ]
      },
      {
        "particular": "Cash flow from Operations",
        "history": [
          { "period": "Mar 2025", "value": 178703 },
          { "period": "Mar 2024", "value": 158788 },
          { "period": "Mar 2023", "value": 115032 },
          { "period": "Mar 2022", "value": 110654 }
        ]
      },
      {
        "particular": "Cash flow from Investing",
        "history": [
          { "period": "Mar 2025", "value": -137535 },
          { "period": "Mar 2024", "value": -113581 },
          { "period": "Mar 2023", "value": -91235 },
          { "period": "Mar 2022", "value": -110103 }
        ]
      },
      {
        "particular": "Cash flow from Financing",
        "history": [
          { "period": "Mar 2025", "value": -31891 },
          { "period": "Mar 2024", "value": -16646 },
          { "period": "Mar 2023", "value": 10455 },
          { "period": "Mar 2022", "value": 17289 }
        ]
      },
      {
        "particular": "Total Cash Flow",
        "history": [
          { "period": "Mar 2025", "value": 9277 },
          { "period": "Mar 2024", "value": 28561 },
          { "period": "Mar 2023", "value": 34252 },
          { "period": "Mar 2022", "value": 17840 }
        ]
      },
      {
        "particular": "Cash (Start of the year)",
        "history": [
          { "period": "Mar 2025", "value": 97225 },
          { "period": "Mar 2024", "value": 68664 },
          { "period": "Mar 2023", "value": 36178 },
          { "period": "Mar 2022", "value": 17397 }
        ]
      },
      {
        "particular": "Cash (End of the year)",
        "history": [
          { "period": "Mar 2025", "value": 106502 },
          { "period": "Mar 2024", "value": 97225 },
          { "period": "Mar 2023", "value": 68664 },
          { "period": "Mar 2022", "value": 36178 }
        ]
      }
    ]
  }
}


Sample Code
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/fundamentals/INE002A01018/cash-flow'
params = {
    'type': 'consolidated',
    'fs': 'true'
}
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, params=params, headers=headers)
print(response.json())

Previous
Get Balance Sheet

Next
Get Income Statement

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































































Developer API
Market Data
Fundamentals
Get Income Statement
On this page
GET
/fundamentals/:isin/income-statement
Get Income Statement
API to retrieve the historical income statement (profit and loss) data for a company identified by its ISIN. The response groups income data by category (Revenue, Operating profit, Net profit), each with historical values and period-over-period percentage changes. You can filter by statement type (consolidated or standalone) and reporting frequency (yearly or quarterly). All monetary values are in Indian Rupees (Crore).
Path Parameters
Query Parameters
Request
curl --location 'https://api.upstox.com/v2/fundamentals/INE002A01018/income-statement?type=consolidated&time_period=yearly&fs=true' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": {
    "type": "consolidated",
    "time_period": "yearly",
    "units_in": "crore",
    "income_statement": [
      {
        "category": "revenue",
        "history": [
          { "value": 1086181, "period": "Mar 2026", "change": "+10.53%" },
          { "value": 982671, "period": "Mar 2025", "change": "+7.15%" },
          { "value": 917121, "period": "Mar 2024", "change": "+3.1%" },
          { "value": 889569, "period": "Mar 2023" }
        ]
      },
      {
        "category": "operating_profit",
        "history": [
          { "value": 123162, "period": "Mar 2026", "change": "+16.17%" },
          { "value": 106017, "period": "Mar 2025", "change": "+1.61%" },
          { "value": 104340, "period": "Mar 2024", "change": "+10.95%" },
          { "value": 94046, "period": "Mar 2023" }
        ]
      },
      {
        "category": "net_profit",
        "history": [
          { "value": 95610, "period": "Mar 2026", "change": "+18.35%" },
          { "value": 80787, "period": "Mar 2025", "change": "+2.74%" },
          { "value": 78633, "period": "Mar 2024", "change": "+6.13%" },
          { "value": 74088, "period": "Mar 2023" }
        ]
      }
    ],
    "full_statement": [
      {
        "particular": "Revenue",
        "history": [
          { "period": "Mar 2025", "value": 964693 },
          { "period": "Mar 2024", "value": 901064 },
          { "period": "Mar 2023", "value": 877835 },
          { "period": "Mar 2022", "value": 695963 }
        ]
      },
      {
        "particular": "Other Income",
        "history": [
          { "period": "Mar 2025", "value": 17978 },
          { "period": "Mar 2024", "value": 16057 },
          { "period": "Mar 2023", "value": 11734 },
          { "period": "Mar 2022", "value": 14943 }
        ]
      },
      {
        "particular": "Total Revenue",
        "history": [
          { "period": "Mar 2025", "value": 982671 },
          { "period": "Mar 2024", "value": 917121 },
          { "period": "Mar 2023", "value": 889569 },
          { "period": "Mar 2022", "value": 710906 }
        ]
      },
      {
        "particular": "Total Expenses",
        "history": [
          { "period": "Mar 2025", "value": 876654 },
          { "period": "Mar 2024", "value": 812781 },
          { "period": "Mar 2023", "value": 795547 },
          { "period": "Mar 2022", "value": 631883 }
        ]
      },
      {
        "particular": "Profit Before Tax",
        "history": [
          { "period": "Mar 2025", "value": 106017 },
          { "period": "Mar 2024", "value": 104340 },
          { "period": "Mar 2023", "value": 94046 },
          { "period": "Mar 2022", "value": 82154 }
        ]
      },
      {
        "particular": "Tax",
        "history": [
          { "period": "Mar 2025", "value": 25230 },
          { "period": "Mar 2024", "value": 25707 },
          { "period": "Mar 2023", "value": 20376 },
          { "period": "Mar 2022", "value": 15970 }
        ]
      },
      {
        "particular": "Profit After Tax",
        "history": [
          { "period": "Mar 2025", "value": 80787 },
          { "period": "Mar 2024", "value": 78633 },
          { "period": "Mar 2023", "value": 73670 },
          { "period": "Mar 2022", "value": 66184 }
        ]
      },
      {
        "particular": "EPS - Basic",
        "history": [
          { "period": "Mar 2025", "value": 51.47 },
          { "period": "Mar 2024", "value": 51.45 },
          { "period": "Mar 2023", "value": 98.59 },
          { "period": "Mar 2022", "value": 92 }
        ]
      },
      {
        "particular": "EPS - Diluted",
        "history": [
          { "period": "Mar 2025", "value": 51.47 },
          { "period": "Mar 2024", "value": 51.45 },
          { "period": "Mar 2023", "value": 98.59 },
          { "period": "Mar 2022", "value": 90.86 }
        ]
      }
    ]
  }
}


Sample Code
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/fundamentals/INE002A01018/income-statement'
params = {
    'type': 'consolidated',
    'time_period': 'yearly',
    'fs': 'true'
}
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, params=params, headers=headers)
print(response.json())

Previous
Get Cash Flow

Next
Get Share Holdings

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































































Developer API
Market Data
Fundamentals
Get Share Holdings
On this page
GET
/fundamentals/:isin/share-holdings
Get Share Holdings
API to retrieve the quarterly shareholding pattern for a company identified by its ISIN. The response breaks down the ownership structure by shareholder type — such as Promoters, FII (Foreign Institutional Investors), DII (Domestic Institutional Investors), and Public — across multiple reporting quarters, expressed as a percentage of total shares.
Path Parameters
Request
curl --location 'https://api.upstox.com/v2/fundamentals/INE002A01018/share-holdings' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": [
    {
      "category": "promoters",
      "history": [
        { "period": "Mar 2026", "value": 50.0 },
        { "period": "Dec 2025", "value": 50.01 },
        { "period": "Sep 2025", "value": 50.01 },
        { "period": "Jun 2025", "value": 50.07 }
      ]
    },
    {
      "category": "fii",
      "history": [
        { "period": "Mar 2026", "value": 18.67 },
        { "period": "Dec 2025", "value": 19.09 },
        { "period": "Sep 2025", "value": 18.65 },
        { "period": "Jun 2025", "value": 19.21 }
      ]
    },
    {
      "category": "other_dii",
      "history": [
        { "period": "Mar 2026", "value": 10.77 },
        { "period": "Dec 2025", "value": 10.66 },
        { "period": "Sep 2025", "value": 10.67 },
        { "period": "Jun 2025", "value": 10.48 }
      ]
    },
    {
      "category": "mutual_funds",
      "history": [
        { "period": "Mar 2026", "value": 9.78 },
        { "period": "Dec 2025", "value": 9.52 },
        { "period": "Sep 2025", "value": 9.66 },
        { "period": "Jun 2025", "value": 9.32 }
      ]
    },
    {
      "category": "retail_and_other",
      "history": [
        { "period": "Mar 2026", "value": 10.79 },
        { "period": "Dec 2025", "value": 10.73 },
        { "period": "Sep 2025", "value": 11.01 },
        { "period": "Jun 2025", "value": 10.92 }
      ]
    }
  ]
}


Sample Code
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/fundamentals/INE002A01018/share-holdings'
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)
print(response.json())

Previous
Get Income Statement

Next
Get Key Ratios

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































































Developer API
Market Data
Fundamentals
Get Key Ratios
On this page
GET
/fundamentals/:isin/key-ratios
Get Key Ratios
API to retrieve the key financial ratios for a company identified by its ISIN. Each ratio includes the company's current value alongside a sector benchmark value, enabling relative valuation comparisons. Ratios returned include P/E, P/B, ROA, ROE, ROCE, and EV/EBITDA.
Path Parameters
Request
curl --location 'https://api.upstox.com/v2/fundamentals/INE002A01018/key-ratios' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": [
    { "name": "P/E", "company_value": "20.15", "sector_value": "12.46" },
    { "name": "P/B", "company_value": "2.13", "sector_value": "1.53" },
    { "name": "ROA", "company_value": "4.39%", "sector_value": "7.54%" },
    { "name": "ROE", "company_value": "8.94%", "sector_value": "16.46%" },
    { "name": "ROCE", "company_value": "10.39%", "sector_value": "16.9%" },
    { "name": "EV/EBITDA", "company_value": "10.25", "sector_value": "6.94" }
  ]
}
Ratio definitions:


Sample Code
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/fundamentals/INE002A01018/key-ratios'
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)
print(response.json())

Previous
Get Share Holdings

Next
Get Corporate Actions

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK









































































































































Developer API
Market Data
Fundamentals
Get Corporate Actions
On this page
GET
/fundamentals/:isin/corporate-actions
Get Corporate Actions
API to retrieve the corporate actions for a company identified by its ISIN. The response contains a list of events such as dividends, bonus issues, stock splits, and rights issues, each with detailed sub-event information including announcement dates, ex-dates, record dates, and amounts.
Path Parameters
Request
curl --location 'https://api.upstox.com/v2/fundamentals/INE002A01018/corporate-actions' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data": [
    {
      "name": "Dividend",
      "expiry_date": "14 Aug 2025",
      "amount": 5.5,
      "ratio": null,
      "event_details": [
        { "name": "Announcement date", "value": "25 Apr 2025" },
        { "name": "Ex dividend date", "value": "14 Aug 2025" },
        { "name": "Record date", "value": "14 Aug 2025" },
        { "name": "Dividend type", "value": "Final" },
        { "name": "Amount", "value": "5.5" },
        { "name": "Dividend %", "value": "55.0" },
        { "name": "Details", "value": "Rs.5.5000 per share(55%)Final Dividend" }
      ]
    }
  ]
}


Sample Code
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/fundamentals/INE002A01018/corporate-actions'
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, headers=headers)
print(response.json())

Previous
Get Key Ratios

Next
Get Competitors

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK










































































































































Developer API
Market Data
News
Get News
On this page
GET
/news
Get News
API to retrieve news for one or more instruments. This API returns news published in the past 7 days (one week). You can fetch news articles in three ways — for specific stocks you're interested in, for instruments you currently hold a position in, or for stocks in your long-term portfolio:
Specific instruments — pass category=instrument_keys along with the instrument keys you want news for (up to 30 at a time).
Your open positions — pass category=positions and the API automatically fetches news for everything you currently have a position in.
Your holdings — pass category=holdings and the API fetches news for all stocks in your holdings portfolio.
Query Parameters
Request
curl --location 'https://api.upstox.com/v2/news?category=instrument_keys&instrument_keys=NSE_EQ%7CINE040H01021' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer {your_access_token}'
For additional samples in various languages, please refer to the Sample code section on this page.
Responses
200
4XX
Response Body
{
  "status": "success",
  "data":{
    "NSE_EQ|INE040H01021": [
      {
        "heading": "SMIDs outperform: Nifty Smallcap 100, Nifty Midcap 100 rise over 2%; Suzlon Energy, Afcons Infra top gainers",
        "summary": "On a year-on-year basis, the Nifty Midcap 100 index has gained 13%, while the Nifty Smallcap 100 gauge rose 6%",
        "thumbnail": "https://assets.upstox.com/content/assets/images/news/traders-assemble-hero.webp",
        "article_link": "https://upstox.com/news/market-news/latest-updates/smids-outperform/article-181757/",
        "published_time": 1776251261821
      }
    ]
  }
  "metadata": {
    "page": {
      "page_number": 1,
      "page_size": 10,
      "total_records": 1,
      "total_pages": 1
    }
  }
}


Sample Code
Fetch news by instrument keys
Python
Node.js
Java
PHP
import requests

url = 'https://api.upstox.com/v2/news'
params = {
    'category': 'instrument_keys',
    'instrument_keys': 'NSE_EQ|INE040H01021,NSE_EQ|INE002A01018'
}
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, params=params, headers=headers)

print(response.json())
Fetch news for your positions
Python
Node.js
Java
PHP
import requests

# Use category='holdings' to fetch news for your holdings instead
url = 'https://api.upstox.com/v2/news'
params = {'category': 'positions'}
headers = {
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}'
}

response = requests.get(url, params=params, headers=headers)

print(response.json())

Previous
News

Next
Websocket

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.

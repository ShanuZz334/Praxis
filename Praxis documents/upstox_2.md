Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK
















































































































































Developer API
Realtime & Streaming
Websocket
Market Data Feed V3
On this page
WSS
/feed/market-data-feed
Market Data Feed V3
The Market Stream Feed V3 provides real-time market updates, including the latest trading price, close price, open price, and more, through a WebSocket connection. The feed utilizes Protobuf encoding, which requires decoding messages using the provided Market Data V3 Proto file.
With the V3 version, significant enhancements have been introduced, offering improved stability, performance, and reliability for uninterrupted data delivery. This version also includes limitations on connections and subscriptions to ensure a stable and efficient data transmission process. These limitations are designed to optimize performance and maintain consistent feed quality.
To connect to the WebSocket endpoint, use the wss: protocol. Ensure that your WebSocket client is configured to handle automatic redirection to the authorized endpoint after authentication. For example, in a Node.js client, enabling the followRedirects setting facilitates seamless handling of redirection.
Once connected, you can subscribe to the required instrumentKeys by specifying the method and mode based on your needs. Ensure that the subscription request adheres to the V3 format. Incoming data from the feed must be decoded using Protobuf and the provided .proto file, properly adapted to your programming language for compatibility. The following table lists the defined limits for the feeder, which must be adhered to for uninterrupted data streaming.
New Instruments
Global Index — Major global stock market indices such as GIFT NIFTY, Dow Jones, S&P, FTSE 100, and more. See Global Instruments for details and download the Global Instruments file for instrument keys.
India VIX — The NSE Volatility Index, available using instrument key NSE_INDEX|India VIX.
Binary message format
The WebSocket request message should be sent in binary format, not as a text message.
Normal Connection and Subscription Limits
Connection and Subscription Limits under Upstox Plus 
The Individual Limit refers to the maximum number of instrument keys allowed when a user subscribes to a single category. For instance, if a user subscribes only to 'LTPC', they can access up to 5000 instrument keys.
The Combined Limit applies when subscriptions cover multiple categories. For example, if the same user subscribes to both 'LTPC' and 'Option Greeks', the limit for each category is set to 2000 instrument keys. This structure ensures users can efficiently manage multiple data streams within system capacity constraints.


Header Parameters
Request structure
{
  "guid": "13syxu852ztodyqncwt0",
  "method": "sub",
  "data": {
    "mode": "full",
    "instrumentKeys": ["NSE_INDEX|Nifty Bank"]
  }
}
Method field values
Mode field values
Responses
302
This API does not provide a typical JSON response. Instead, upon successful authentication, it automatically redirects the client to the appropriate websocket endpoint where market updates can be received in real-time. Users are expected to handle data streams as per the websocket protocol once the redirection is complete.
The feeds are structured to ensure seamless data flow and synchronization.
The first tick provides the market status, giving the current state of various market segments to ensure synchronization.
The second tick delivers a snapshot of the current market data, offering the latest available information.
Subsequent ticks stream live, real-time updates, ensuring clients stay updated with the latest market activity.


Market Status
The market_info is the first message sent for all feeds. It provides the real-time status of various market segments, ensuring the client is aware of the current trading conditions before streaming data. This helps synchronize the client with active segments and prevents unnecessary data processing for inactive or closed segments.
{
  "type": "market_info",
  "currentTs": "1732775008661",
  "marketInfo": {
    "segmentStatus": {
      "NSE_COM": "NORMAL_OPEN",
      "NCD_FO": "NORMAL_OPEN",
      "NSE_FO": "NORMAL_OPEN",
      "BSE_EQ": "NORMAL_OPEN",
      "BCD_FO": "NORMAL_OPEN",
      "BSE_FO": "NORMAL_OPEN",
      "NSE_EQ": "NORMAL_OPEN",
      "MCX_FO": "NORMAL_OPEN",
      "MCX_INDEX": "NORMAL_OPEN",
      "NSE_INDEX": "NORMAL_OPEN",
      "BSE_INDEX": "NORMAL_OPEN"
    }
  }
}


Market Data Snapshot
The second tick provides a snapshot of the current market data, presenting the latest state of the market at the time of connection. This ensures the client starts with an accurate and up-to-date view of market conditions. The following is a sample object for LTPC.
{
  "type": "live_feed",
  "feeds": {
    "NSE_FO|45450": {
      "ltpc": {
        "ltp": 219.3,
        "ltt": "1740729552723",
        "ltq": "75",
        "cp": 494.05
      }
    }
  },
  "currentTs": "1740729566039"
}
Live Feed

LTPC
Option Greeks
Full
Full D30 (Plus)
{
  "type": "live_feed",
  "feeds": {
    "NSE_FO|45450": {
      "ltpc": {
        "ltp": 219.3,
        "ltt": "1740729552723",
        "ltq": "75",
        "cp": 494.05
      }
    }
  },
  "currentTs": "1740729566039"
}
Heartbeat
If there is no data to stream over an open WebSocket connection, the API automatically sends a standard ping frame periodically to maintain the connection's aliveness. Most standard WebSocket client libraries across various programming languages handle this automatically by responding with a pong frame, requiring no manual intervention.

Previous
Websocket

Next
Get Market Data Feed Authorized Url V3

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK
















































































































































Developer API
Realtime & Streaming
Websocket
Get Market Data Feed Authorized Url V3
On this page
GET
/feed/market-data-feed/authorize
Market Data Feed Authorize V3
API to retrieve the designated socket endpoint URI for Market updates. This endpoint is intended for use with a WebSocket client. If automatic redirection is not configured through the Market Stream Feed V3 API, this API serves as an alternative method to acquire the necessary wss:// URL for establishing a connection via a WebSocket client.
New Instruments
Global Index — Major global stock market indices such as GIFT NIFTY, Dow Jones, S&P, FTSE 100, and more. See Global Instruments for details and download the Global Instruments file for instrument keys.
India VIX — The NSE Volatility Index, available using instrument key NSE_INDEX|India VIX.
Header Parameters
Responses
200
Response Body
{
  "status": "success",
  "data": {
    "authorized_redirect_uri": "wss://xyz.upstox.com/market-data-feeder/v3/upstox-developer-api/feeds?requestId=2f646f57-a097-4402-bb36-c44085c5f8e7&code=9355b100-25cf-4fa7-b038-06d27ddb4823",
  }
}
Heartbeat
If there is no data to stream over an open WebSocket connection, the API automatically sends a standard ping frame periodically to maintain the connection's aliveness. Most standard WebSocket client libraries across various programming languages handle this automatically by responding with a pong frame, requiring no manual intervention.

Previous
Market Data Feed V3

Next
Portfolio Stream Feed

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK
















































































































































Developer API
Realtime & Streaming
Websocket
Portfolio Stream Feed
On this page
WSS
/feed/portfolio-stream-feed
Portfolio Stream Feed
The Order update stream feed communicates all order updates when connected over the websocket. No request object is required for this. The communication will start immediately after the connection is successfully established.
Integration involves connecting to the provided endpoint using the wss: protocol through a WebSocket client, which is configured to automatically redirect to the authorized WebSocket endpoint upon authentication. Therefore, the client's configuration must be adjusted to support this automatic redirection. For example, in a Node.js client, you should enable the followRedirects setting to facilitate seamless handling of redirection.
Order updates across platforms
The order update WebSocket ensures that you receive updates on your order regardless of the platform used to place it. Whether you place an order through the Upstox mobile app or via the web application, you will still receive the order updates through the API WebSocket, and the same applies in reverse.
Header Parameters
Query Parameters
Responses
302
This API does not provide a typical JSON response. Instead, upon successful authentication, it automatically redirects the client to the appropriate websocket endpoint where order updates can be received in real-time. Users are expected to handle data streams as per the websocket protocol once the redirection is complete.
Following is a sample of an order update message received on the socket.
Message Structure

Order
GTT Order
Holding
Position
{
  "update_type": "order",
  "user_id": "******",
  "userId": "******",
  "exchange": "NSE",
  "instrument_token": "NSE_EQ|INE848E01016",
  "instrument_key": "NSE_EQ|INE848E01016",
  "trading_symbol": "NHPC-EQ",
  "tradingsymbol": "NHPC-EQ",
  "product": "D",
  "order_type": "MARKET",
  "average_price": 0,
  "price": 0,
  "trigger_price": 0,
  "quantity": 1,
  "disclosed_quantity": 0,
  "pending_quantity": 1,
  "transaction_type": "BUY",
  "order_ref_id": "57744821658411",
  "exchange_order_id": "",
  "parent_order_id": null,
  "validity": "DAY",
  "status": "put order req received",
  "is_amo": false,
  "variety": "SIMPLE",
  "tag": null,
  "exchange_timestamp": null,
  "status_message": "",
  "order_id": "240221025997024",
  "order_request_id": "1",
  "order_timestamp": "2024-02-21 14:40:02",
  "filled_quantity": 0,
  "guid": null,
  "placed_by": "******",
  "status_message_raw": null
}

Heartbeat
If there is no data to stream over an open WebSocket connection, the API automatically sends a standard ping frame periodically to maintain the connection's aliveness. Most standard WebSocket client libraries across various programming languages handle this automatically by responding with a pong frame, requiring no manual intervention.
Notice of Deprecation
The lowercase field (tradingsymbol) is deprecated and will be removed in future versions. Use the snake_case versions for consistency.

Previous
Get Market Data Feed Authorized Url V3

Next
Get Portfolio Stream Feed Authorized Url

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK
















































































































































Developer API
Realtime & Streaming
Websocket
Get Portfolio Stream Feed Authorized Url
On this page
GET
/feed/portfolio-stream-feed/authorize
Portfolio Stream Feed Authorize
API to retrieve the designated socket endpoint URI for Portfolio updates. This endpoint is intended for use with a WebSocket client. If automatic redirection is not configured through the Portfolio Stream Feed API, this API serves as an alternative method to acquire the necessary wss:// URL for establishing a connection via a WebSocket client.
Order updates across platforms
The order update WebSocket ensures that you receive updates on your order regardless of the platform used to place it. Whether you place an order through the Upstox mobile app or via the web application, you will still receive the order updates through the API WebSocket, and the same applies in reverse.
Header Parameters
Query Parameters
Responses
200
Response Body
{
  "status": "success",
  "data": {
    "authorized_redirect_uri": "wss://xyz.upstox.com/upstox-developer-api/order-updates/feed?requestId=2f646f57-a097-4402-bb36-c44085c5f8e7&code=9355b100-25cf-4fa7-b038-06d27ddb4823",
    "authorizedRedirectUri": "wss://xyz.upstox.com/upstox-developer-api/order-updates/feed?requestId=2f646f57-a097-4402-bb36-c44085c5f8e7&code=9355b100-25cf-4fa7-b038-06d27ddb4823"
  }
}
Heartbeat
If there is no data to stream over an open WebSocket connection, the API automatically sends a standard ping frame periodically to maintain the connection's aliveness. Most standard WebSocket client libraries across various programming languages handle this automatically by responding with a pong frame, requiring no manual intervention.
Notice of Deprecation
The camelCase field (authorizedRedirectUri) is deprecated and will be removed in future versions. Use the snake_case versions for consistency.

Previous
Portfolio Stream Feed

Next
Market Data Feed

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK
















































































































































Developer API
Realtime & Streaming
Websocket
Market Data Feed
On this page
WSS
/feed/market-data-feed
Market Data Feed Discontinued
The Market stream feed communicates market updates(latest trading price, close price, open price, etc.) when connected over the websocket. The market data feed response requires decoding using protobuf, utilizing the provided proto file. You'll need to translate the Market Data Proto File into the appropriate format compatible with your specific programming language.
Integration involves connecting to the provided endpoint using the wss: protocol through a WebSocket client, which is configured to automatically redirect to the authorized WebSocket endpoint upon authentication. Therefore, the client's configuration must be adjusted to support this automatic redirection. For example, in a Node.js client, you should enable the followRedirects setting to facilitate seamless handling of redirection.
After establishing a connection, proceed by subscribing to the necessary instrumentKeys, selecting the method and mode according to your preference. Ensure that the request structure aligns with the format outlined here.
Candles returned per interval
For the 1d interval, a single candle representing the previous day is returned. In the case of I1 and I30 intervals, two candles, one for the current and one for the preceding are provided.
Header Parameters
Subscription limit
Over the socket, you have the capacity to subscribe to up to 100 instrumentKeys.
Request structure
{
  "guid": "someguid",
  "method": "sub",
  "data": {
    "mode": "full",
    "instrumentKeys": ["NSE_INDEX|Nifty Bank"]
  }
}
Method field values
Mode field values
Responses
302
This API does not provide a typical JSON response. Instead, upon successful authentication, it automatically redirects the client to the appropriate websocket endpoint where market updates can be received in real-time. Users are expected to handle data streams as per the websocket protocol once the redirection is complete.
Message Structure

FO
EQ
Index
Response received with mode ltpc
{
  "feeds": {
    "NSE_FO|50201": {
      "ltpc": {
        "ltp": 141,
        "ltt": "1725875999894",
        "ltq": "25",
        "cp": 233.95
      }
    }
  },
  "currentTs": "1725876064349"
}
Response received with mode option_chain
{
  "feeds": {
    "NSE_FO|50201": {
      "oc": {
        "ltpc": {
          "ltp": 141,
          "ltt": "1725875999894",
          "ltq": "25",
          "cp": 233.95
        },
        "bidAskQuote": {
          "bq": 600,
          "bp": 141,
          "bno": 3,
          "aq": 50,
          "ap": 141.35,
          "ano": 1,
          "bidQ": "600",
          "askQ": "50"
        },
        "optionGreeks": {
          "op": 141,
          "up": 24951.931923793596,
          "iv": 0.127716064453125,
          "delta": -0.5637,
          "theta": -18.9642,
          "gamma": 0.0014,
          "vega": 8.9092,
          "rho": -1.1677
        },
        "eFeedDetails": {
          "atp": 189.33,
          "cp": 233.95,
          "vtt": "32205075",
          "oi": 2811525,
          "tbq": 58850,
          "tsq": 94825,
          "lc": 0.05,
          "uc": 628.75,
          "fp": 141,
          "fv": 25,
          "dhoi": 3375025,
          "dloi": 2671675,
          "poi": 3021775
        }
      }
    }
  },
  "currentTs": "1725876528408"
}
Response received with mode full
{
  "feeds": {
    "NSE_FO|50201": {
      "ff": {
        "marketFF": {
          "ltpc": {
            "ltp": 141,
            "ltt": "1725875999894",
            "ltq": "25",
            "cp": 233.95
          },
          "marketLevel": {
            "bidAskQuote": [
              {
                "bq": 600,
                "bp": 141,
                "bno": 3,
                "aq": 50,
                "ap": 141.35,
                "ano": 1,
                "bidQ": "600",
                "askQ": "50"
              },
              {
                "bq": 625,
                "bp": 140,
                "bno": 5,
                "aq": 25,
                "ap": 141.45,
                "ano": 1,
                "bidQ": "625",
                "askQ": "25"
              },
              {
                "bq": 25,
                "bp": 139.6,
                "bno": 1,
                "aq": 875,
                "ap": 142,
                "ano": 2,
                "bidQ": "25",
                "askQ": "875"
              },
              {
                "bq": 100,
                "bp": 139.5,
                "bno": 2,
                "aq": 100,
                "ap": 142.5,
                "ano": 1,
                "bidQ": "100",
                "askQ": "100"
              },
              {
                "bq": 175,
                "bp": 139,
                "bno": 3,
                "aq": 50,
                "ap": 142.95,
                "ano": 1,
                "bidQ": "175",
                "askQ": "50"
              }
            ]
          },
          "optionGreeks": {
            "op": 141,
            "up": 24951.931923793596,
            "iv": 0.127716064453125,
            "delta": -0.5637,
            "theta": -18.9642,
            "gamma": 0.0014,
            "vega": 8.9092,
            "rho": -1.1677
          },
          "marketOHLC": {
            "ohlc": [
              {
                "interval": "1d",
                "open": 260,
                "high": 282.7,
                "low": 136.75,
                "close": 141,
                "volume": 32205075,
                "ts": "1725820200000",
                "vol": "32205075"
              },
              {
                "interval": "I1",
                "open": 138.5,
                "high": 144.2,
                "low": 138.4,
                "close": 143.75,
                "volume": 232500,
                "ts": "1725875880000",
                "vol": "232500"
              },
              {
                "interval": "I1",
                "open": 143.9,
                "high": 146.5,
                "low": 140,
                "close": 141,
                "volume": 151250,
                "ts": "1725875940000",
                "vol": "151250"
              },
              {
                "interval": "I30",
                "open": 173.5,
                "high": 178,
                "low": 138.45,
                "close": 142.55,
                "volume": 3288600,
                "ts": "1725873300000",
                "vol": "3288600"
              },
              {
                "interval": "I30",
                "open": 142.65,
                "high": 158.7,
                "low": 136.75,
                "close": 141,
                "volume": 2336050,
                "ts": "1725875100000",
                "vol": "2336050"
              }
            ]
          },
          "eFeedDetails": {
            "atp": 189.33,
            "cp": 233.95,
            "vtt": "32205075",
            "oi": 2811525,
            "tbq": 58850,
            "tsq": 94825,
            "lc": 0.05,
            "uc": 628.75,
            "fp": 141,
            "fv": 25,
            "dhoi": 3375025,
            "dloi": 2671675,
            "poi": 3021775
          }
        }
      }
    }
  },
  "currentTs": "1725876633607"
}
Heartbeat
If there is no data to stream over an open WebSocket connection, the API automatically sends a standard ping frame periodically to maintain the connection's aliveness. Most standard WebSocket client libraries across various programming languages handle this automatically by responding with a pong frame, requiring no manual intervention.
Notice of Deprecation
Several fields (bidAskQuote.ano, bidAskQuote.bno, bidAskQuote.bq, and others) part of the Market Feed ticker will be deprecated starting from October 10, 2024, and will be removed in future versions. For further details, please refer to the Market Feed Changes Announcement.

Previous
Get Portfolio Stream Feed Authorized Url

Next
Get Market Data Feed Authorized Url

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK
















































































































































Developer API
Realtime & Streaming
Websocket
Get Market Data Feed Authorized Url
On this page
GET
/feed/market-data-feed/authorize
Market Data Feed Authorize Discontinued
API to retrieve the designated socket endpoint URI for Market updates. This endpoint is intended for use with a WebSocket client. If automatic redirection is not configured through the Market Stream Feed API, this API serves as an alternative method to acquire the necessary wss:// URL for establishing a connection via a WebSocket client.
Header Parameters
Responses
200
Response Body
{
  "status": "success",
  "data": {
    "authorized_redirect_uri": "wss://xyz.upstox.com/market-data-feeder/v2/upstox-developer-api/feeds?requestId=2f646f57-a097-4402-bb36-c44085c5f8e7&code=9355b100-25cf-4fa7-b038-06d27ddb4823",
    "authorizedRedirectUri": "wss://xyz.upstox.com/market-data-feeder/v2/upstox-developer-api/feeds?requestId=2f646f57-a097-4402-bb36-c44085c5f8e7&code=9355b100-25cf-4fa7-b038-06d27ddb4823"
  }
}
Heartbeat
If there is no data to stream over an open WebSocket connection, the API automatically sends a standard ping frame periodically to maintain the connection's aliveness. Most standard WebSocket client libraries across various programming languages handle this automatically by responding with a pong frame, requiring no manual intervention.
Notice of Deprecation
The camelCase field (authorizedRedirectUri) is deprecated and will be removed in future versions. Use the snake_case versions for consistency.

Previous
Market Data Feed

Next
Websocket Implementation

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































































































































Developer API
Realtime & Streaming
Websocket Implementation
Websocket Implementation
The websocket streaming provides an efficient way to receive market and order related communication over a long standing connection.
Websockets offer several technical advantages over standard API calls:
Efficiency: Instead of repeatedly polling for data, websockets allow data to be pushed to the client as it becomes available.
Real-time: Websockets provide real-time communication which is crucial for trading applications where every second counts.
Reduced overhead: With websockets, the overhead of establishing a connection is reduced as one connection can be kept open for longer durations.
Websockets should be preferred when:
Real-time updates are required.
The frequency of data updates is high, making regular API polling inefficient.
Reducing network overhead is a priority.
We provide two types of streaming options:
Market related changes for the subscribed entities
Order related updates
Streamer FunctionsUse Upstox API streamer functions to connect to WebSocket feeds for live market data and portfolio updates via SDK helper methods for trading platforms.

Previous
Get Market Data Feed Authorized Url

Next
Streamer Functions

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































































































































Developer API
Realtime & Streaming
Websocket Implementation
Streamer Functions
On this page
Streamer Functions
Prerequisites
Connecting to the WebSocket for market and portfolio updates is streamlined through two primary Feeder functions. Both functions are designed to simplify the process of subscribing to essential data streams, ensuring users have quick and easy access to the information they need.
You need to have the SDK installed for the specific language you are using. For detailed installation instructions and repository links, refer to the Installing the Upstox SDK guide.
MarketDataStreamerV3
The MarketDataStreamerV3 interface is designed for effortless connection to the market WebSocket, enabling users to receive instantaneous updates on various instruments. The following example demonstrates how to quickly set up and start receiving market updates for selected instrument keys:
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client

def on_message(message):
    print(message)


def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration), ["NSE_INDEX|Nifty 50", "NSE_INDEX|Nifty Bank"], "full")

    streamer.on("message", on_message)

    streamer.connect()


if __name__ == "__main__":
    main()


In this example, you first authenticate using an access token, then instantiate MarketDataStreamerV3 with specific instrument keys and a subscription mode. Upon connecting, the streamer listens for market updates, which are logged to the console as they arrive.
Feel free to adjust the access token placeholder and any other specifics to better fit your actual implementation or usage scenario.
Exploring the MarketDataStreamerV3 Functionality
Modes
ltpc: ltpc provides information solely about the most recent trade, encompassing details such as the last trade price, time of the last trade, quantity traded, and the closing price from the previous day.
full: The full option offers comprehensive information, including the latest trade prices, D5 depth, 1-minute, 30-minute, and daily candlestick data, along with some additional details.
option_greeks: Contains only option greeks.
full_d30: full_d30 includes Full mode data plus 30 market level quotes. 
Functions
constructor MarketDataStreamerV3(apiClient, instrumentKeys, mode): Initializes the streamer with optional instrument keys and mode (full, ltpc, full_d30, or option_greeks).
connect(): Establishes the WebSocket connection.
subscribe(instrumentKeys, mode): Subscribes to updates for given instrument keys in the specified mode. Both parameters are mandatory.
unsubscribe(instrumentKeys): Stops updates for the specified instrument keys.
changeMode(instrumentKeys, mode): Switches the mode for already subscribed instrument keys.
disconnect(): Ends the active WebSocket connection.
auto_reconnect(enable, interval, retryCount): Customizes auto-reconnect functionality. Parameters include a flag to enable/disable it, the interval(in seconds) between attempts, and the maximum number of retries.
Events
open: Emitted upon successful connection establishment.
close: Indicates the WebSocket connection has been closed.
message: Delivers market updates.
error: Signals an error has occurred.
reconnecting: Announced when a reconnect attempt is initiated.
autoReconnectStopped: Informs when auto-reconnect efforts have ceased after exhausting the retry count.
The following documentation includes examples to illustrate the usage of these functions and events, providing a practical understanding of how to interact with the MarketDataStreamerV3 effectively.
Subscribing to Market Data on Connection Open with MarketDataStreamerV3
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_open():
        streamer.subscribe(
            ["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full")

    def on_message(message):
        print(message)

    streamer.on("open", on_open)
    streamer.on("message", on_message)

    streamer.connect()

if __name__ == "__main__":
    main()


Subscribing to Instruments with Delays
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client
import time


def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_open():
        streamer.subscribe(
            ["NSE_EQ|INE020B01018"], "full")

    # Handle incoming market data messages\
    def on_message(message):
        print(message)

    streamer.on("open", on_open)
    streamer.on("message", on_message)

    streamer.connect()

    time.sleep(5)
    streamer.subscribe(
        ["NSE_EQ|INE467B01029"], "full")


if __name__ == "__main__":
    main()


Subscribing and Unsubscribing Instruments
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client
import time


def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_open():
        print("Connected. Subscribing to instrument keys.")
        streamer.subscribe(
            ["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full")

    # Handle incoming market data messages\
    def on_message(message):
        print(message)

    streamer.on("open", on_open)
    streamer.on("message", on_message)

    streamer.connect()

    time.sleep(5)
    print("Unsubscribing from instrument keys.")
    streamer.unsubscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"])


if __name__ == "__main__":
    main()


Subscribe, Change Mode and Unsubscribe
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client
import time

def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_open():
        print("Connected. Subscribing to instrument keys.")
        streamer.subscribe(
            ["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "full")

    # Handle incoming market data messages\
    def on_message(message):
        print(message)

    streamer.on("open", on_open)
    streamer.on("message", on_message)

    streamer.connect()

    time.sleep(5)
    print("Changing subscription mode to ltpc...")
    streamer.change_mode(
        ["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"], "ltpc")

    time.sleep(5)
    print("Unsubscribing from instrument keys.")
    streamer.unsubscribe(["NSE_EQ|INE020B01018", "NSE_EQ|INE467B01029"])


if __name__ == "__main__":
    main()


Disable Auto-Reconnect
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client
import time


def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    def on_reconnection_halt(message):
        print(message)

    streamer.on("autoReconnectStopped", on_reconnection_halt)

    # Disable auto-reconnect feature
    streamer.auto_reconnect(False)

    streamer.connect()


if __name__ == "__main__":
    main()


Modify Auto-Reconnect parameters
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client


def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration))

    # Modify auto-reconnect parameters: enable it, set interval to 10 seconds, and retry count to 3
    streamer.auto_reconnect(True, 10, 3)

    streamer.connect()


if __name__ == "__main__":
    main()


PortfolioDataStreamer
Connecting to the Portfolio WebSocket for real-time order updates is straightforward with the PortfolioDataStreamer function. Below is a concise guide to get you started on receiving updates. For detailed API documentation, refer to the Portfolio Stream Feed API.
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client

def on_message(message):
    print(message)


def main():
    configuration = upstox_client.Configuration()
    access_token = <ACCESS_TOKEN>
    configuration.access_token = access_token

    streamer = upstox_client.PortfolioDataStreamer(
        upstox_client.ApiClient(configuration))

    streamer.on("message", on_message)

    streamer.connect()


if __name__ == "__main__":
    main()


Position, Holding, and GTT order updates can be enabled by setting the corresponding flag to True in the constructor of the PortfolioDataStreamer class.
Python SDK
Node.js SDK
Java SDK
PHP SDK
import upstox_client
import data_token


def on_message(message):
    print(message)


def on_open():
    print("connection opened")


def main():
    configuration = upstox_client.Configuration()
    configuration.access_token = <ACCESS_TOKEN>

    streamer = upstox_client.PortfolioDataStreamer(upstox_client.ApiClient(configuration),
                                                  order_update=True,
                                                  position_update=True,
                                                  holding_update=True,
                                                  gtt_update=True)

    streamer.on("message", on_message)
    streamer.on("open", on_open)
    streamer.connect()


if __name__ == "__main__":
    main()


Exploring the PortfolioDataStreamer Functionality
Constructor Parameters
api_client: Your API client instance
order_update: Set to True to receive real-time order updates (default: True)
position_update: Set to True to receive position updates (default: False)
holding_update: Set to True to receive holding updates (default: False)
gtt_update: Set to True to receive GTT order updates (default: False)
Functions
constructor PortfolioDataStreamer(): Initializes the streamer.
connect(): Establishes the WebSocket connection.
disconnect(): Ends the active WebSocket connection.
auto_reconnect(enable, interval, retryCount): Customizes auto-reconnect functionality. Parameters include a flag to enable/disable it, the interval(in seconds) between attempts, and the maximum number of retries.
Events
open: Emitted upon successful connection establishment.
close: Indicates the WebSocket connection has been closed.
message: Delivers market updates.
error: Signals an error has occurred.
reconnecting: Announced when a reconnect attempt is initiated.
autoReconnectStopped: Informs when auto-reconnect efforts have ceased after exhausting the retry count.

Previous
Websocket Implementation

Next
Webhook

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































































































































Developer API
Realtime & Streaming
Webhook
On this page
Webhook
During the app registration process, users have the option to specify an open POST API as their webhook URL. On configuring the postback URL, order updates will be instantaneously transmitted to this address.
As part of the webhook flow, users can receive both:
Order Updates
GTT Order Updates
When registering an app, users can choose what type of updates they wish to receive. By default, order updates are enabled. To receive GTT order updates, users must explicitly enable this by editing their app’s configuration from the My Apps page.





The webhook endpoint:
Should not require authentication.
Should respond with a 2XX status.
Must be open to receive POST requests.
The payloads sent to the webhook URL will be identical to the updates received via WebSocket.
Response structure:
Order
GTT Order
{
  "update_type": "order",
  "user_id": "******",
  "userId": "******",
  "exchange": "NSE",
  "instrument_token": "NSE_EQ|INE848E01016",
  "instrument_key": "NSE_EQ|INE848E01016",
  "trading_symbol": "NHPC-EQ",
  "tradingsymbol": "NHPC-EQ",
  "product": "D",
  "order_type": "MARKET",
  "average_price": 0,
  "price": 0,
  "trigger_price": 0,
  "quantity": 1,
  "disclosed_quantity": 0,
  "pending_quantity": 1,
  "transaction_type": "BUY",
  "order_ref_id": "57744821658411",
  "exchange_order_id": "",
  "parent_order_id": null,
  "validity": "DAY",
  "status": "put order req received",
  "is_amo": false,
  "variety": "SIMPLE",
  "tag": null,
  "exchange_timestamp": null,
  "status_message": "",
  "order_id": "240221025997024",
  "order_request_id": "1",
  "order_timestamp": "2024-02-21 14:40:02",
  "filled_quantity": 0,
  "guid": null,
  "placed_by": "******",
  "status_message_raw": null
}
Notice of Deprecation
The lowercase field (tradingsymbol) is deprecated and will be removed in future versions. Use the snake_case versions for consistency.

Securing your webhook URL
While creating app provide a webhook URL which is in your control rather than a public endpoint.

Previous
Streamer Functions

Next
Appendix

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































































































































Developer API
Appendix
Static IPs
On this page
Configure Static IPs
The My Apps platform has been enhanced to improve security, compliance, and user experience, in line with the requirements for retail investors participating in algo trading.
1. My Apps Listing
For trading purposes, you can create an Algo Trading App.
Each user is associated with 2 IPs (Primary and Secondary) that can be configured in the app settings. Orders will be accepted only from these registered IPs.

2. Configuring Primary and Secondary IPs
Click Static IPs in the app listing to open the IP configuration form. Here, you can set your Primary and Secondary IP addresses. These IPs will be used for order placement through the API.

Platform Update Notes
The IP address can only be updated once per week. When updated, the existing access token will be invalidated.
Orders will be rejected once the rule is enforced, unless your new IP address is updated and traffic originates from it.
Additional Resources
For approval of registered apps, please reach out to our Developer Community.
Programmatic static IP management (user-level): Get static IPs and Update static IPs (primary_ip required, secondary_ip optional).
Please refer to the updated Order Rate Limiting.
For more details, please refer to the Algo Trading Circular Announcement.

Previous
Agent Skills

Next
Notifier Webhook Endpoint

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

















































































































































Developer API
Appendix
Notifier Webhook Endpoint
On this page
Notifier Webhook Endpoint
What is the Notifier Webhook Endpoint?
A Notifier Webhook Endpoint is a designated URL used to receive automated notifications or updates asynchronously from a system. In the context of API integrations, it serves as a callback mechanism where the Upstox API service sends specific data, such as access tokens, after an event is triggered.
Key Features of a Notifier Webhook Endpoint:
Purpose: Acts as the recipient for system-generated notifications, such as the delivery of an access_token etc.
Configuration: Typically specified during the app generation process.
Communication: Operates as a POST API where the Upstox API system sends the data.
Response: The endpoint should acknowledge receipt by returning either a plain string or a JSON object.
Authentication: The endpoint should not require authentication.
In summary, the Notifier Webhook Endpoint facilitates automated communication between systems, ensuring real-time data transfer without manual intervention.
Configure Notifier Webhook Endpoint during App Generation
Follow these steps to set up a notifier webhook endpoint for an API app:
My Apps Section: Visit the Upstox My Apps page to view the active my apps section. Here, you can manage your app and token.

Setup Notifier Webhook Endpoint:
Click the New App button to open the new application form. This form allows you to provide details for your new app.
To update an existing app, Click the Edit button to open the application form containing existing app details.
In addition to the fields for the redirect URL and postback URL, a new optional field called Notifier Webhook Endpoint has been added.

Complete the App Form: Fill in the required fields in the form to define your app. After entering the information, click Continue to create/update an app. 
Recommended notifier configuration
We recommend that access token initiators advise their customers to configure the initiator's POST API as the notifier webhook endpoint. This ensures that initiators receive Upstox API events related to Upstox API actions asynchronously.

Previous
Static IPs

Next
Postman Collection

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK




















































Developer API
Appendix
Field Pattern
Field Pattern
This section outlines the specific regex patterns required for various field inputs, ensuring data consistency and validation. Refer to these specifications to avoid common input errors and streamline data submission processes.
order_id
Pattern: ^[-a-zA-Z0-9]+
symbol
Pattern: ^(?:NSE_EQ|NSE_FO|NCD_FO|BSE_EQ|BSE_FO|BCD_FO|MCX_FO|NSE_COM|NSE_INDEX|BSE_INDEX|MCX_INDEX)\|[\w ]+(,(?:NSE_EQ|NSE_FO|NCD_FO|BSE_EQ|BSE_FO|BCD_FO|MCX_FO|NSE_COM|NSE_INDEX|BSE_INDEX|MCX_INDEX)\|[\w ]+)*?$
financial_year
Pattern: ^(0|[1-9][0-9]*)$
instrumentKey
Pattern: ^(?:^NSE_EQ|NSE_FO|NCD_FO|BSE_EQ|BSE_FO|BCD_FO|MCX_FO|NSE_COM|NSE_INDEX|BSE_INDEX|MCX_INDEX)\|[\w ]+(,(?:NSE_EQ|NSE_FO|NCD_FO|BSE_EQ|BSE_FO|BCD_FO|MCX_FO|NSE_COM|NSE_INDEX|BSE_INDEX|MCX_INDEX)\|[\w ]+)*?$
instrument_token
Pattern: ^(?:^NSE_EQ|NSE_FO|NCD_FO|BSE_EQ|BSE_FO|BCD_FO|MCX_FO|NSE_COM|NSE_INDEX|BSE_INDEX|MCX_INDEX)\|[\w ]+(,(?:NSE_EQ|NSE_FO|NCD_FO|BSE_EQ|BSE_FO|BCD_FO|MCX_FO|NSE_COM|NSE_INDEX|BSE_INDEX|MCX_INDEX)\|[\w ]+)*?$
instrument_key
Pattern: ^(?:^NSE_EQ|NSE_FO|NCD_FO|BSE_EQ|BSE_FO|BCD_FO|MCX_FO|NSE_COM|NSE_INDEX|BSE_INDEX|MCX_INDEX)\|[\w ]+(,(?:NSE_EQ|NSE_FO|NCD_FO|BSE_EQ|BSE_FO|BCD_FO|MCX_FO|NSE_COM|NSE_INDEX|BSE_INDEX|MCX_INDEX)\|[\w ]+)*?$
exchange
Pattern: ^(\s*|(?:NSE|NFO|CDS|BSE|BFO|BCD|MCX|NSCOM)+)$
expired_instrument_key
Pattern: ^(?:NSE_EQ|NSE_FO|NCD_FO|BSE_EQ|BSE_FO|BCD_FO|MCX_FO|NSE_INDEX|BSE_INDEX|MCX_INDEX|NSE_COM)\|[\w\d\-]+\|(0[1-9]|[12]\d|3[01])-(0[1-9]|1[012])-(\d{4})$

Previous
Order Status

Next
Instant Withdrawal Eligibility

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK

























Example Code
Getting Started
Login
Get Token
On this page
Get Token
Get access token using auth code
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/login/authorization/token';
const headers = {
  'accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
};

const data = {
  'code': '{your_code}',
  'client_id': '{your_client_id}',
  'client_secret': '{your_client_secret}',
  'redirect_uri': '{your_redirect_url}',
  'grant_type': 'authorization_code',
};

axios.post(url, new URLSearchParams(data), { headers })
  .then(response => {
    console.log(response.status);
    console.log(response.data);
  })
  .catch(error => {
    console.error(error.response.status);
    console.error(error.response.data);
  });

Previous
Example Code

Next
Access Token Request

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK



























Example Code
Account & Funds
User
Get Profile
On this page
Get Profile
Get user profile information using access token
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/user/profile';
const headers = {
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}'
};

axios.get(url, { headers })
  .then(response => {
    console.log(response.status);
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });


Previous
Get Expired Historical Candle Data

Next
Get Fund and Margin

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK










































Example Code
Orders & Trading
Order
Place Order
On this page
Place Order Code Examples
Place a delivery market order
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api-hft.upstox.com/v2/order/place';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}',
};

const data = {
  quantity: 1,
  product: 'D',
  validity: 'DAY',
  price: 0,
  tag: 'string',
  instrument_token: 'NSE_EQ|INE669E01016',
  order_type: 'MARKET',
  transaction_type: 'BUY',
  disclosed_quantity: 0,
  trigger_price: 0,
  is_amo: false,
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
Place a delivery limit order
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api-hft.upstox.com/v2/order/place';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}',
};

const data = {
  quantity: 1,
  product: 'D',
  validity: 'DAY',
  price: 13,
  tag: 'string',
  instrument_token: 'NSE_EQ|INE669E01016',
  order_type: 'LIMIT',
  transaction_type: 'BUY',
  disclosed_quantity: 0,
  trigger_price: 13.2,
  is_amo: false,
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
Place a delivery stop-loss order
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api-hft.upstox.com/v2/order/place';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}',
};

const data = {
  quantity: 1,
  product: 'D',
  validity: 'DAY',
  price: 14.05,
  tag: 'string',
  instrument_token: 'NSE_EQ|INE669E01016',
  order_type: 'SL',
  transaction_type: 'BUY',
  disclosed_quantity: 0,
  trigger_price: 13,
  is_amo: false,
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
Place a delivery stop-loss order market
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api-hft.upstox.com/v2/order/place';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}',
};

const data = {
  quantity: 1,
  product: 'D',
  validity: 'DAY',
  price: 0.0,
  tag: 'string',
  instrument_token: 'NSE_EQ|INE669E01016',
  order_type: 'SL-M',
  transaction_type: 'BUY',
  disclosed_quantity: 0,
  trigger_price: 15,
  is_amo: false,
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
Place an intraday market order
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api-hft.upstox.com/v2/order/place';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}',
};

const data = {
  quantity: 1,
  product: 'I',
  validity: 'DAY',
  price: 0.0,
  tag: 'string',
  instrument_token: 'NSE_EQ|INE528G01035',
  order_type: 'MARKET',
  transaction_type: 'BUY',
  disclosed_quantity: 0,
  trigger_price: 0,
  is_amo: false,
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });

Place an intraday limit order
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api-hft.upstox.com/v2/order/place';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}',
};

const data = {
  quantity: 1,
  product: 'I',
  validity: 'DAY',
  price: 20.0,
  tag: 'string',
  instrument_token: 'NSE_EQ|INE528G01035',
  order_type: 'LIMIT',
  transaction_type: 'BUY',
  disclosed_quantity: 0,
  trigger_price: 20.1,
  is_amo: false,
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });

Place an intraday stop-loss order
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api-hft.upstox.com/v2/order/place';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}',
};

const data = {
  quantity: 1,
  product: 'I',
  validity: 'DAY',
  price: 20.0,
  tag: 'string',
  instrument_token: 'NSE_EQ|INE528G01035',
  order_type: 'SL',
  transaction_type: 'BUY',
  disclosed_quantity: 0,
  trigger_price: 19.5,
  is_amo: false,
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });

Place an intraday stop-loss market order
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api-hft.upstox.com/v2/order/place';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}',
};

const data = {
  quantity: 1,
  product: 'I',
  validity: 'DAY',
  price: 0.0,
  tag: 'string',
  instrument_token: 'NSE_EQ|INE528G01035',
  order_type: 'SL-M',
  transaction_type: 'BUY',
  disclosed_quantity: 0,
  trigger_price: 21.5,
  is_amo: false,
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });

Place a delivery market amo (after market order)
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api-hft.upstox.com/v2/order/place';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Bearer {your_access_token}',
};

const data = {
  quantity: 1,
  product: 'D',
  validity: 'DAY',
  price: 0,
  tag: 'string',
  instrument_token: 'NSE_EQ|INE669E01016',
  order_type: 'MARKET',
  transaction_type: 'BUY',
  disclosed_quantity: 0,
  trigger_price: 0,
  is_amo: true,
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });

Previous
Margin Details

Next
Place Order V3

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK














































Example Code
Portfolio
Portfolio
Convert Positions
On this page
Convert Positions
Convert a position from intraday to delivery
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/portfolio/convert-position';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}', // Replace {your_access_token} with your actual access token
};

const data = {
    "instrument_token": "NSE_EQ|INE528G01035",
    "new_product": "D",
    "old_product": "I",
    "transaction_type": "BUY",
    "quantity": 1
};

axios.put(url, data, { headers })
    .then(response => {
        console.log('Status Code:', response.status);
        console.log('Response Data:', response.data);
    })
    .catch(error => {
        console.error('Error:', error.message);
    });
Convert a position from delivery to intraday
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/portfolio/convert-position';
const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer {your_access_token}', // Replace {your_access_token} with your actual access token
};

const data = {
    "instrument_token": "NSE_EQ|INE528G01035",
    "new_product": "I",
    "old_product": "D",
    "transaction_type": "BUY",
    "quantity": 1
};

axios.put(url, data, { headers })
    .then(response => {
        console.log('Status Code:', response.status);
        console.log('Response Data:', response.data);
    })
    .catch(error => {
        console.error('Error:', error.message);
    });

Previous
Get GTT Order Details

Next
Get Holdings

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.
Skip to main content
📢 Important Update: Regulatory Changes for API and Algo Trading are Now Live - Click here for more details.




ctrlK


















































Example Code
Market Data
Historical Data
Historical Candle Data
On this page
Historical Candle Data
Get historical candle data with a 1-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13/2023-11-12';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
Get data with a 30-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13/2023-11-12';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
Get data with a daily interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19/2023-11-12';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
Get data with a weekly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19/2023-07-12';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });

Get data with a monthly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19/2022-11-12';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });


Get historical candle data with a 1-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/1minute/2023-11-13';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
Get data with a 30-minute interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/30minute/2023-11-13';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
Get data with a daily interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/day/2023-11-19';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });
Get data with a weekly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/week/2023-11-19';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });

Get data with a monthly interval
Curl
Python
Node.js
Java
PHP
Python SDK
Node.js SDK
Java SDK
const axios = require('axios');

const url = 'https://api.upstox.com/v2/historical-candle/NSE_EQ%7CINE848E01016/month/2023-11-19';
const headers = {
    'Accept': 'application/json'
};

axios.get(url, { headers })
    .then(response => {
        // Do something with the response data (e.g., print it)
        console.log(response.data);
    })
    .catch(error => {
        // Print an error message if the request was not successful
        console.error(`Error: ${error.response.status} - ${error.response.data}`);
    });

Previous
Get Trade Charges

Next
Historical Candle Data V3

Example CodeAnnouncementsAPI CommunityFAQManage AppsContact usLLM? Read llms.txt
Made with ❤️ in India | Copyright © 2026, Upstox. Built withDocusaurus.

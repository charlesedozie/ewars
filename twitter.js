// Get User mentions timeline by user ID
// https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/quick-start

// my api key QaqT5YF6Zs9xySia8Zc2K5j0a
// my api secret 0HYJbioL4xCSlaNDoYQCdRzWmPgeV4nTdYeLW2PI02vMeHvhgU
// bbearere token AAAAAAAAAAAAAAAAAAAAAHspogEAAAAA2lcSFj0iwOU49ZPoIeEV9n79Lp0%3DiHVVlP4j7QCi5CL8jdLyKeHyqHYAQ8wLGfkiGLOWNj6bnK8YWN

// MY ACCESS TOKEN 1675062389329350659-JjusuLYe2nSTrB2RpKsKEiNH8d2W9c

// MY ACCESS TOKEN SECRET q20gLSgZQfN78T7PTl3zm6jjMuwrp6iLTF60JlxUYlVSk

// open auth2 id NlY1Z19pQUdUMWQwSWN6Y0RfMnQ6MTpjaQ

// open auth 2 secret SC-di0oUhknkuuR_VUr4bExBUoSv-Cr769vQvimGvMFgUjMfEz

// SC-di0oUhknkuuR_VUr4bExBUoSv-Cr769vQvimGvMFgUjMfEz

const needle = require('needle');

const userId = 1675062389329350659;
//const url = `https://api.twitter.com/2/users/${userId}/mentions`;
const mytoken = 'AAAAAAAAAAAAAAAAAAAAAHspogEAAAAA2lcSFj0iwOU49ZPoIeEV9n79Lp0%3DiHVVlP4j7QCi5CL8jdLyKeHyqHYAQ8wLGfkiGLOWNj6bnK8YWN';

// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
// Get User Tweet timeline by user ID
// https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/quick-start



const url = `https://api.twitter.com/2/users/${userId}/tweets`;

// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
const bearerToken = mytoken;

const getUserTweets = async () => {
    let userTweets = [];

    // we request the author_id expansion so that we can print out the user name later
    let params = {
        "max_results": 100,
        "tweet.fields": "created_at",
        "expansions": "author_id"
    }

    const options = {
        headers: {
            "User-Agent": "v2UserTweetsJS",
            "authorization": `Bearer ${bearerToken}`
        }
    }

    let hasNextPage = true;
    let nextToken = null;
    let userName;
    console.log("Retrieving Tweets...");

    while (hasNextPage) {
        let resp = await getPage(params, options, nextToken);
        if (resp && resp.meta && resp.meta.result_count && resp.meta.result_count > 0) {
            userName = resp.includes.users[0].username;
            if (resp.data) {
                userTweets.push.apply(userTweets, resp.data);
            }
            if (resp.meta.next_token) {
                nextToken = resp.meta.next_token;
            } else {
                hasNextPage = false;
            }
        } else {
            hasNextPage = false;
        }
    }

    console.dir(userTweets, {
        depth: null
    });
    console.log(`Got ${userTweets.length} Tweets from ${userName} (user ID ${userId})!`);

}

const getPage = async (params, options, nextToken) => {
    if (nextToken) {
        params.pagination_token = nextToken;
    }

    try {
        const resp = await needle('get', url, params, options);

        if (resp.statusCode != 200) {
            console.log(`${resp.statusCode} ${resp.statusMessage}:\n${resp.body}`);
            return;
        }
        return resp.body;
    } catch (err) {
        throw new Error(`Request failed: ${err}`);
    }
}

getUserTweets();
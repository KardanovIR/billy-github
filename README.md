# Billy for Github
by [iambilly.app](https://iambilly.app)

If you maintain any open source projects you should be familiar with a situation when we need some help. For example:

- You're a backend developer, and you need frontenders' help (or vice versa)
- You're not an expert in some aspect of a product, and you'd like to get a help from an expert

Even if you're not a maintainer or open-source contributor, but only a developer who uses Open Source products, you should be pretty familiar with a situation when you want something from an open source project:

- Some specific bug to be fixed ASAP
- Some new functionality

### Octobilly gives a tool to handle all of it  

## How it works

Octobilly is a GitHub app, which creates an economy for Open Source projects and can be installed by any user. 

### Installation

Octobilly can be installed by following this link: [https://github.iambilly.app/auth](https://github.iambilly.app/auth).
After installation Octobilly creates a new blockchain account for you. This account will be used for rewards.

### Rewards

Octobilly starts watching all your open source repositories and pay rewards for your activities. You'll get tokens for every repository every day, if you made at least one commit in the repository.
The number of tokens you get for every repository with commits is calculated by the formula:

```
Reward = Ak * sqrt(Sr + Fr)
```

Where
 - `Ak` - activity rate (values are in [1;2], 1 - you were active in the repo only today in the last 30 days, 2 - you were active 30 days out of 30 last days) 
 - `Sr` - stars count for a repository
 - `Fr` - forks count for a repository
 
This formula is applied to every repository you give an access to.

### Using tokens

Tokens can be used in the next ways:

1. `@octobilly 100 thanks @username` - tokens can be transferred to any other user by in issue text or comment, pull request comment or commit comment. If the recipient not installed Octobilly yet, they will get their tokens later.
2. `@octobilly 100` - tokens can be attached to an issue as a reward. This number of tokens will be transferred to a user who will [close the issue with their commit message](https://help.github.com/en/enterprise/2.16/user/github/managing-your-work-on-github/closing-issues-using-keywords#about-issue-references).  

There is also a dashboard with open bounties with attached tokens:
**[https://github.iambilly.app/](https://github.iambilly.app/)**

#### Reactions
Depending on the status of your command, @octobilly will add a reaction to your message:

- 🚀 - transaction was executed successfully
- 👀 - started watching an issue, will transfer tokens if somebody will close an issue with a commit
- 😕 - something went wrong (usually, not enought balance)

Examples of messages and reactions can be found here - [Demo issue](https://github.com/KardanovIR/billy-github/issues/12)

## Blockchain

Blockchain is used in the project to make the whole system transparent. All the reward systems have value only you can be sure that nobody will just prin/mint/brrrr more tokens for them. 1 000 000 000 tokens were minted and will be distributed and all the transactions are available here - [http://51.15.71.229:16971](http://51.15.71.229:16971). 

This project uses Waves Blockchain Node, but runs in a separate chain to make all transactions free for the community.

### Node operators

There is only one blockchain operator right now, but any Open Source project can [open an issue in this repository](https://github.com/KardanovIR/billy-github/issues/new) and request to tokens to run a node. 
Open Source projects which run a node can also get a fund of reward tokens to attach to their issues.
    
We hope that in the future different big Open Source projects and communities will run nodes in the Octobilly network.
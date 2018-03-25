# OmniverseServer

A Node based server for hosting Omniverse asset bundle metadata

# Installation
## To run
To run the server the only dependencies are Docker and an internet connection. Install Docker, and then
read [Deployment].

## To develop
When developing the server you can either work with a Docker image workflow, or develop locally. To develop
on Docker, all you need is Docker installed on your system. To develop locally, you'll need yarn and Node
installed on your system.

Once Yarn and Node are installed on your system, clone the repository and cd into the cloned repository. Then
run *yarn* to install packages.

To watch /src file file changes, and recompile anytime a file changes, you can run *yarn grunt watch*. To run
a development server which reboots each time files in the /build folder change, you can run *yarn dev*.

The server requires a backend database. You can either install postgreSQL on your system or you can use a Docker
container. Even if you choose not to develop using Docker to host the application, using the Docker database image
is a lot easier (since you never change anything in the image directly).

To start only the postgres server use:
```
docker-compose up postgres
```

There's also a seeding task which will add a small amount of sample data to the database, as well as wiping current
contents:
```
yarn reseed
```

# Development Guidelines
The server is written in TypeScript, and uses Mocha as the unit testing framework. The server uses tslint to enforce
style options. Before opening a pull request, ensure that tests are passing and tslint shows no errors. When contributing
code to the server, your code should include unit tests to test the functionality, and the pull request should include
a description of the issue addressed (if any), as well as the functionality changed.

# Deployment
To deploy the server, run:
```
docker-compose up
```

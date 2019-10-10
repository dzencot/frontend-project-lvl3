install:
	npm install

lint:
	npx eslint ./

test:
	npm test

test-watch:
	npx test-watch

check-all:
	make lint
	make test

build:
	rm -rf dist
	npx build

build-debug:
	DEBUG="rss-reader:*" npx build

deploy:
	npx deploy

publish:
	npm publish

.PHONY: test

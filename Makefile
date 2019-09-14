install:
	npm install

lint:
	npm run eslint ./

test:
	npm run test

test-watch:
	npm run test-watch

build:
	rm -rf dist
	npm run build

publish:
	npm publish

.PHONY: test

const parsePost = (data) => {
  const link = data.querySelector('link');
  const title = data.querySelector('title');
  const description = data.querySelector('description');
  if (link.length === 0 && title.length === 0 && description.length === 0) {
    const errorMessage = 'Not found post data';
    throw new Error(errorMessage);
  }
  return {
    link: link.textContent || link.getAttribute('href'),
    title: title.textContent,
    description: description ? description.textContent : '',
  };
};

const parseFeed = (data) => {
  const domParser = new DOMParser();
  const parsedData = domParser.parseFromString(data, 'text/xml');

  const link = parsedData.querySelector('rss > channel > link, feed > link');
  const title = parsedData.querySelector('rss > channel > title, feed > title');
  const description = parsedData.querySelector('rss > channel > description, feed > title');

  const dataPosts = Array.from(parsedData.querySelectorAll('item, entry'));

  if (title.length === 0 && description.length === 0
    && link.length === 0 && dataPosts.length === 0) {
    const errorMessage = 'Not found feed data';
    throw new Error(errorMessage);
  }

  const items = dataPosts.map((item) => parsePost(item));

  return {
    link: link.textContent,
    title: title.textContent,
    description: description.textContent,
    items,
  };
};

export default parseFeed;

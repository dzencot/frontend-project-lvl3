const parsePost = (feedUrl, data) => {
  const link = data.querySelector('link');
  const title = data.querySelector('title');
  const description = data.querySelector('description');
  if (link.length === 0 && title.length === 0) {
    const errorMessage = 'Not found post data';
    throw new Error(errorMessage);
  }
  return {
    feedUrl,
    link: link.textContent || link.getAttribute('href'),
    title: title.textContent,
    description: description ? description.textContent : '',
  };
};

const getRSSData = (link, data) => {
  const domParser = new DOMParser();
  const parsedData = domParser.parseFromString(data, 'text/xml');
  const title = parsedData.querySelector('rss > channel > title, feed > title');
  const description = parsedData.querySelector('rss > channel > description, feed > title');
  if (title.length === 0 && description.length === 0) {
    const errorMessage = 'Not found feed data';
    throw new Error(errorMessage);
  }
  const dataPosts = Array.from(parsedData.querySelectorAll('item, entry'));
  const posts = dataPosts.map((item) => parsePost(link, item));
  return {
    feed: {
      link,
      title: title.textContent,
      description: description.textContent,
    },
    posts,
  };
};

export default getRSSData;

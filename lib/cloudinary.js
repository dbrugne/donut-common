module.exports = {
  prepare: function (url, size, crop) {
    if (!url || url === '') {
      return null;
    }

    size = size || 100;

    if (crop) {
      url = url.replace(/__crop__/, crop);
    }

    return url
      .replace(/__width__/, size)
      .replace(/__height__/, size);
  }
};

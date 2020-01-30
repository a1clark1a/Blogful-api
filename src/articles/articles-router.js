const path = require("path");
const express = require("express");
const xss = require("xss");
const ArticleService = require("./articles_service");

const articlesRouter = express.Router();
const jsonParser = express.json();

serializedArticle = article => ({
  id: article.id,
  date_published: new Date(article.date_published),
  title: xss(article.title),
  style: article.style,
  content: xss(article.content),
  author: article.author
});

articlesRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    ArticleService.getAllArticles(knexInstance)
      .then(articles => {
        res.json(
          articles.map(article => ({
            id: article.id,
            date_published: new Date(article.date_published),
            title: xss(article.title),
            style: article.style,
            content: xss(article.content),
            author: article.author
          }))
        );
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get("db");
    const { title, content, style, author } = req.body;
    const newArticle = { title, content, style };

    for (const [key, value] of Object.entries(newArticle)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }
    newArticle.author = author;
    ArticleService.insertArticle(knexInstance, newArticle)
      .then(article => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${article.id}`))
          .json({
            id: article.id,
            date_published: new Date(article.date_published),
            title: xss(article.title),
            style: article.style,
            content: xss(article.content),
            author: article.author
          });
      })
      .catch(next);
  });

articlesRouter
  .route("/:article_id")
  .all((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { article_id } = req.params;
    ArticleService.getById(knexInstance, article_id)
      .then(article => {
        if (!article) {
          return res.status(404).json({
            error: { message: `Article doesn't exist` }
          });
        }
        res.article = article;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializedArticle(res.article));
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { article_id } = req.params;
    ArticleService.deleteArticle(knexInstance, article_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, content, style } = req.body;
    const articleToUpdate = { title, content, style };
    const knexInstance = req.app.get("db");
    const { article_id } = req.params;

    const numberOfValues = Object.values(articleToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'style' or 'content'`
        }
      });
    }
    ArticleService.updateArticle(knexInstance, article_id, articleToUpdate)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = articlesRouter;

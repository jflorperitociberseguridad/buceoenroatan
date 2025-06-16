// script.js

document.addEventListener("DOMContentLoaded", () => {
  fetch("blog.json")
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById("blog-entries");
      data.forEach(entry => {
        const article = document.createElement("article");
        article.innerHTML = `
          <h3>${entry.titulo}</h3>
          <small>${new Date(entry.fecha).toLocaleDateString('es-ES')}</small>
          <p>${entry.contenido}</p>
        `;
        container.appendChild(article);
      });
    })
    .catch(error => {
      console.error("Error cargando los artículos del blog:", error);
    });
});

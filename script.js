// script.js
document.addEventListener("DOMContentLoaded", () => {
  fetch("blog.json")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("blog-entries");
      data.forEach((entry, index) => {
        const article = document.createElement("article");
        article.classList.add("blog-card");

        // Añade delay incremental para cada tarjeta
        article.style.animationDelay = `${index * 0.2}s`;

        const imgSrc = entry.imagen && entry.imagen.trim() !== ""
          ? entry.imagen
          : "https://via.placeholder.com/600x400/00b4d8/ffffff?text=Roatán+Buceo";

        article.innerHTML = `
          <img src="${imgSrc}" alt="${entry.titulo}" />
          <div class="blog-content">
              <h3>${entry.titulo}</h3>
              <small>${new Date(entry.fecha).toLocaleDateString("es-ES")}</small>
              <p>${entry.contenido}</p>
          </div>
        `;

        container.appendChild(article);

        // Aplica visibilidad una vez insertado
        setTimeout(() => {
          article.style.opacity = "1";
        }, 10);
      });
    })
    .catch(err => {
      console.error("Error al cargar blog.json:", err);
    });
});
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

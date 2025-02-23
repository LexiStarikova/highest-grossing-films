// Load and display films from JSON file
document.addEventListener("DOMContentLoaded", function () {
    fetch("films.json")
        .then(response => response.json())
        .then(data => {
            displayFilms(data);
        })
        .catch(error => console.error("Error loading data:", error));
});

function displayFilms(films) {
    const tableBody = document.getElementById("film-table-body");
    tableBody.innerHTML = ""; // Clear existing data
    
    films.forEach(film => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td>${film.title}</td>
            <td>${film.release_year}</td>
            <td>${film.director}</td>
            <td>${film.box_office}</td>
            <td>${film.country}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Implement search functionality
document.getElementById("search").addEventListener("input", function () {
    let searchTerm = this.value.toLowerCase();
    let rows = document.querySelectorAll("tbody tr");
    
    rows.forEach(row => {
        let title = row.cells[0].textContent.toLowerCase();
        row.style.display = title.includes(searchTerm) ? "" : "none";
    });
});
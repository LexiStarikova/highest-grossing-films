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
            <td>${film.directors}</td>
            <td>$${formatCurrency(film.box_office)}</td>
            <td>${film.countries_of_origin}</td>
            <td>${film.production_companies}</td>
        `;
        tableBody.appendChild(row);
    });
    
    plotBoxOfficeChart(films);
    setupColumnFilter();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        notation: 'compact',
        compactDisplay: 'short'
    }).format(value);
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

function plotBoxOfficeChart(films) {
    const ctx = document.getElementById("boxOfficeChart").getContext("2d");
    
    // Sort films by box office revenue
    const sortedFilms = [...films].sort((a, b) => b.box_office - a.box_office).slice(0, 10);
    
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: sortedFilms.map(f => f.title),
            datasets: [{
                label: "Box Office Revenue",
                data: sortedFilms.map(f => f.box_office),
                backgroundColor: sortedFilms.map((_, i) => 
                    `hsla(${(i * 360 / sortedFilms.length)}, 70%, 60%, 0.7)`
                ),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: ['Top 10 Highest-Grossing Films', '(Logarithmic Scale)'],
                    font: { size: 16 }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `Revenue: $${formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    type: 'logarithmic',
                    beginAtZero: false,
                    ticks: {
                        callback: value => `$${formatCurrency(value)}`
                    }
                }
            }
        }
    });

    // Create bubble chart
    const bubbleCtx = document.getElementById("bubbleChart").getContext("2d");
    
    // Generate random y-values between 1-100 for visual spread
    const bubbleData = films.map(film => ({
        x: film.release_year,
        y: Math.random() * 100,
        r: Math.sqrt(film.box_office) / 100000, // Scale the radius based on box office
        title: film.title,
        revenue: film.box_office
    }));

    new Chart(bubbleCtx, {
        type: 'bubble',
        data: {
            datasets: [{
                data: bubbleData,
                backgroundColor: bubbleData.map((_, i) => 
                    `hsla(${(i * 360 / bubbleData.length)}, 70%, 60%, 0.7)`
                ),
                hoverBackgroundColor: bubbleData.map((_, i) => 
                    `hsla(${(i * 360 / bubbleData.length)}, 70%, 60%, 0.9)`
                )
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Films by Year and Box Office Revenue',
                    font: { size: 16 }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const point = context.raw;
                            return [
                                `Title: ${point.title}`,
                                `Year: ${point.x}`,
                                `Revenue: $${formatCurrency(point.revenue)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Release Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Distribution'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function setupColumnFilter() {
    const filterInputs = document.querySelectorAll('.column-filter');
    
    filterInputs.forEach(input => {
        input.addEventListener('input', function() {
            applyFilters();
        });
    });
}

function applyFilters() {
    const rows = document.querySelectorAll('#film-table-body tr');
    const filters = {};
    
    // Collect all filter values
    document.querySelectorAll('.column-filter').forEach(input => {
        const columnIndex = input.dataset.column;
        const filterValue = input.value.toLowerCase().trim();
        if (filterValue) {
            filters[columnIndex] = filterValue;
        }
    });
    
    // Apply filters to each row
    rows.forEach(row => {
        let showRow = true;
        for (const [columnIndex, filterValue] of Object.entries(filters)) {
            const cellText = row.children[columnIndex].textContent.toLowerCase();
            if (!cellText.includes(filterValue)) {
                showRow = false;
                break;
            }
        }
        row.style.display = showRow ? '' : 'none';
    });
}
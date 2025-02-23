// Add this at the top level of your script
let films = []; // Global variable to store films data
let statsVisible = false;
let charts = {}; // Object to store chart instances
let bubbleChart = null;  // Store bubble chart instance globally

document.addEventListener("DOMContentLoaded", function () {
    // Initialize UI elements
    const toggleButton = document.getElementById('toggleStats');
    const aggregationSelect = document.getElementById('aggregationType');
    const detailedStats = document.getElementById('detailedStats');

    // Set up event listeners
    toggleButton.addEventListener('click', function() {
        statsVisible = !statsVisible;
        detailedStats.style.display = statsVisible ? 'flex' : 'none';
        aggregationSelect.style.display = statsVisible ? 'inline-block' : 'none';
        toggleButton.textContent = statsVisible ? 'Hide Detailed Statistics' : 'See Detailed Statistics';
        
        if (statsVisible) {
            updateDetailedStats(aggregationSelect.value);
        }
    });

    aggregationSelect.addEventListener('change', function() {
        updateDetailedStats(this.value);
    });

    // Load data
    fetch("films.json")
        .then(response => response.json())
        .then(data => {
            films = data; // Store the data globally
            displayFilms(data);
        })
        .catch(error => console.error("Error loading data:", error));

    // Add bubble chart regeneration
    document.getElementById('regenerateBubble').addEventListener('click', function() {
        if (bubbleChart) {
            // Update y-values with new random values
            bubbleChart.data.datasets[0].data.forEach(point => {
                point.y = Math.random() * 100;
            });
            bubbleChart.update();
        }
    });
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

// Update the search functionality
document.getElementById("search").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        let searchTerm = this.value.toLowerCase();
        let rows = document.querySelectorAll("#film-table-body tr");
        
        rows.forEach(row => {
            let title = row.cells[0].textContent.toLowerCase();
            row.style.display = title.includes(searchTerm) ? "" : "none";
        });

        // Scroll to table
        document.getElementById("table-section").scrollIntoView({ 
            behavior: "smooth",
            block: "start"
        });
    }
});

// Add scroll to table function
function scrollToTable() {
    document.getElementById("table-section").scrollIntoView({ 
        behavior: "smooth",
        block: "start"
    });
}

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
                    font: { size: 24 }
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
    
    // Destroy existing bubble chart if it exists
    if (bubbleChart) {
        bubbleChart.destroy();
    }
    
    // Use only top 20 films and apply 5th root scaling
    const bubbleData = [...films].sort((a, b) => b.box_office - a.box_office).slice(0, 20)
        .filter(film => film.box_office && film.release_year)
        .map(film => ({
            x: parseInt(film.release_year),
            y: Math.random() * 100,
            r: Math.pow(film.box_office, 1/5) / 2, // 5th root scaling
            title: film.title,
            revenue: film.box_office
        }));

    bubbleChart = new Chart(bubbleCtx, {
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
                    text: 'Top 20 Films by Year and Box Office Revenue (Bubble size: 5th root scale)',
                    font: { size: 24 }
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

function updateDetailedStats(aggregationType) {
    // Add console.log for debugging
    console.log('Updating stats with:', aggregationType);
    console.log('Films data:', films);
    
    const companiesData = aggregateData(films, 'production_companies', 'box_office', aggregationType);
    const directorsData = aggregateData(films, 'directors', 'box_office', aggregationType);
    
    console.log('Companies data:', companiesData);
    console.log('Directors data:', directorsData);
    
    plotDetailedChart('companiesChart', companiesData, 
        `Top 10 Production Companies by ${aggregationType} Box Office Revenue`);
    plotDetailedChart('directorsChart', directorsData, 
        `Top 10 Directors by ${aggregationType} Box Office Revenue`);
}

function aggregateData(films, groupKey, valueKey, aggregationType) {
    // Split multiple values (for companies/directors separated by commas)
    const data = new Map();
    
    films.forEach(film => {
        // Fix the splitting to handle various formats
        const items = film[groupKey].split(/[,/]/).map(item => item.trim());
        items.forEach(item => {
            if (!item) return; // Skip empty items
            if (!data.has(item)) {
                data.set(item, []);
            }
            data.get(item).push(Number(film[valueKey])); // Ensure numbers
        });
    });
    
    // Calculate aggregation
    const aggregated = Array.from(data.entries())
        .filter(([_, values]) => values.length > 0) // Filter out empty arrays
        .map(([key, values]) => ({
            name: key,
            value: calculateAggregation(values, aggregationType)
        }))
        .filter(item => !isNaN(item.value)); // Filter out NaN values
    
    // Sort and get top 10
    return aggregated
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
}

function calculateAggregation(values, type) {
    if (!values.length) return 0;
    
    switch(type) {
        case 'max':
            return Math.max(...values);
        case 'avg':
            return values.reduce((a, b) => a + b, 0) / values.length;
        case 'total':
            return values.reduce((a, b) => a + b, 0);
        default:
            return 0;
    }
}

function plotDetailedChart(canvasId, data, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                data: data.map(d => d.value),
                backgroundColor: data.map((_, i) => 
                    `hsla(${(i * 360 / data.length)}, 70%, 60%, 0.7)`
                ),
                borderWidth: 1,
                barPercentage: 0.8,
                categoryPercentage: 0.9
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: { size: 24 },
                    padding: { bottom: 20 }
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
                    beginAtZero: true,
                    ticks: {
                        callback: value => `$${formatCurrency(value)}`,
                        font: { size: 12 }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 12 }
                    }
                }
            },
            layout: {
                padding: {
                    left: 20,
                    right: 40,
                    top: 20,
                    bottom: 40
                }
            }
        }
    });
}

$ErrorActionPreference = "Stop"

$root = Get-Location
$tsv = Join-Path $root "data\library.tsv"
$docDir = Join-Path $root "data\documents"
$backup = Join-Path $root "data\library-backup.tsv"

if (!(Test-Path $tsv)) { throw "Cannot find data\library.tsv. Run this script from the project root." }
if (!(Test-Path $backup)) { throw "Backup not found. Create data\library-backup.tsv first." }

$records = @(
    @{id=6; title="Introduction to Algorithms"; author="T. H. Cormen"; category="Books"; year=2022; file="algorithms_intro.txt"; content="Algorithms solve computational problems through well-defined steps. Their efficiency is commonly analysed using time and space complexity, including Big-O notation."},
    @{id=7; title="Database Systems Fundamentals"; author="R. Elmasri"; category="Books"; year=2021; file="database_systems.txt"; content="Database systems organize structured information using schemas, tables, keys and queries. Database design aims to support data integrity, efficient retrieval and reliable updates."},
    @{id=8; title="Computer Networks Essentials"; author="A. Tanenbaum"; category="Books"; year=2020; file="computer_networks.txt"; content="Computer networks connect devices to exchange information. Network protocols define communication rules, while routing and addressing help data reach its destination."},
    @{id=9; title="Software Engineering Principles"; author="I. Sommerville"; category="Books"; year=2023; file="software_engineering.txt"; content="Software engineering applies systematic methods to requirements, design, implementation, testing and maintenance. Quality assurance helps identify defects and improve reliability."},
    @{id=10; title="Operating Systems Concepts"; author="A. Silberschatz"; category="Books"; year=2022; file="operating_systems.txt"; content="An operating system manages processes, memory, files and devices. Scheduling and resource management help applications share computer hardware efficiently."},
    @{id=11; title="Evaluating Search Algorithms"; author="L. Phiri"; category="Research Papers"; year=2023; file="search_algorithms_research.txt"; content="Search algorithms can be compared by correctness, execution time and memory use. Linear search examines records sequentially, while binary search requires ordered data."},
    @{id=12; title="Hash Tables for Fast Lookup"; author="M. Banda"; category="Research Papers"; year=2024; file="hash_tables_research.txt"; content="Hash tables map keys to positions using a hash function. Collisions can be handled using chaining or open addressing, with performance depending on load factor and hash quality."},
    @{id=13; title="Boolean Information Retrieval"; author="J. Tembo"; category="Research Papers"; year=2022; file="boolean_retrieval.txt"; content="Boolean retrieval combines query terms with operators such as AND and OR. AND requires all specified terms to match, while OR accepts a match for either term."},
    @{id=14; title="Digital Resource Metadata"; author="P. Mwansa"; category="Research Papers"; year=2025; file="resource_metadata.txt"; content="Metadata describes resources using fields such as title, author, subject and publication year. Consistent metadata improves organization, filtering and discovery."},
    @{id=15; title="Introduction to C Programming"; author="Computer Science Department"; category="Lecture Notes"; year=2024; file="c_programming_notes.txt"; content="C programming uses functions, variables, conditions, loops and structures. Pointers allow programs to work with memory addresses and build linked data structures."},
    @{id=16; title="Algorithm Complexity"; author="School of Computing"; category="Lecture Notes"; year=2023; file="algorithm_complexity_notes.txt"; content="Time complexity describes how an algorithm's work grows with input size. Space complexity describes additional memory requirements. Best, average and worst cases provide different performance perspectives."},
    @{id=17; title="Linked List Operations"; author="School of Computing"; category="Lecture Notes"; year=2025; file="linked_list_operations.txt"; content="Linked list operations include traversal, insertion, searching and deletion. Each node stores data and a pointer, and operations often depend on the node's position."},
    @{id=18; title="Journal of Library Computing"; author="Digital Systems Review"; category="Journals"; year=2024; file="library_computing_journal.txt"; content="Digital library computing explores resource management, indexing, access and preservation. Reliable systems combine useful metadata with efficient retrieval and maintainable storage."},
    @{id=19; title="Information Retrieval Review"; author="Computing Research Review"; category="Journals"; year=2023; file="retrieval_review_journal.txt"; content="Information retrieval research investigates how users find relevant material in large collections. Indexing, query processing and relevance evaluation are important areas of study."},
    @{id=20; title="Data Structures Revision"; author="University Learning Center"; category="Study Guides"; year=2025; file="data_structures_revision.txt"; content="Revise arrays, linked lists, stacks, queues, trees and hash tables. Compare their operations and complexity, and practise selecting suitable structures for common problems."}
)

$existing = Get-Content -LiteralPath $tsv
$existingIds = @{}
foreach ($line in $existing) {
    $parts = $line -split "`t"
    if ($parts.Count -ge 6) { $existingIds[$parts[0]] = $true }
}

foreach ($r in $records) {
    if ($existingIds.ContainsKey([string]$r.id)) {
        Write-Host "Skipping existing ID $($r.id)"
        continue
    }

    $filePath = Join-Path $docDir $r.file
    if (Test-Path $filePath) {
        throw "File already exists: $($r.file). No metadata was added for this record."
    }

    Set-Content -LiteralPath $filePath -Value $r.content -Encoding utf8
    $line = "$($r.id)`t$($r.title)`t$($r.author)`t$($r.category)`t$($r.year)`t$($r.file)"
    Add-Content -LiteralPath $tsv -Value $line -Encoding utf8
    Write-Host "Added ID $($r.id): $($r.title)"
}

Write-Host "`nSample data update finished. Verify the total before continuing."

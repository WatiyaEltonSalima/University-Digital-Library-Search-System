#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <time.h>

#define TITLE_LEN 80

typedef struct Record {
    char title[TITLE_LEN];
    struct Record *next;
} Record;

static volatile int found_sink = 0;

static Record *make_records(int n)
{
    Record *head = NULL;
    for (int i = n - 1; i >= 0; --i) {
        Record *r = malloc(sizeof *r);
        if (!r) {
            perror("malloc");
            exit(EXIT_FAILURE);
        }
        snprintf(r->title, TITLE_LEN, "Resource %05d", i);
        r->next = head;
        head = r;
    }
    return head;
}

static void free_records(Record *head)
{
    while (head) {
        Record *next = head->next;
        free(head);
        head = next;
    }
}

static int ptr_compare(const void *a, const void *b)
{
    const Record *x = *(Record * const *)a;
    const Record *y = *(Record * const*)b;
    return strcasecmp(x->title, y->title);
}

static Record *linear_search(Record *head, const char *key)
{
    for (Record *r = head; r; r = r->next)
        if (strcasecmp(r->title, key) == 0)
            return r;
    return NULL;
}

static Record *binary_search_sorted(Record **arr, size_t n, const char *key)
{
    size_t lo = 0, hi = n;
    while (lo < hi) {
        size_t mid = lo + (hi - lo) / 2;
        int c = strcasecmp(arr[mid]->title, key);
        if (c == 0) return arr[mid];
        if (c < 0) lo = mid + 1;
        else hi = mid;
    }
    return NULL;
}

static double elapsed_ms(clock_t start, clock_t end)
{
    return 1000.0 * (double)(end - start) / CLOCKS_PER_SEC;
}

static void run_test(int n)
{
    Record *head = make_records(n);
    Record **arr = malloc((size_t)n * sizeof *arr);
    if (!arr) {
        perror("malloc");
        free_records(head);
        exit(EXIT_FAILURE);
    }

    size_t i = 0;
    for (Record *r = head; r; r = r->next) arr[i++] = r;

    clock_t start = clock();
    qsort(arr, (size_t)n, sizeof *arr, ptr_compare);
    clock_t end = clock();
    printf("%d,Sorting array,1,%.6f\n", n, elapsed_ms(start, end));

    char target[TITLE_LEN];
    snprintf(target, sizeof target, "Resource %05d", n - 1);

    int reps = 10000;
    start = clock();
    for (int j = 0; j < reps; ++j)
        found_sink += linear_search(head, target) != NULL;
    end = clock();
    printf("%d,Linear search (last record),%d,%.6f\n",
           n, reps, elapsed_ms(start, end) / reps);

    start = clock();
    for (int j = 0; j < reps; ++j)
        found_sink += binary_search_sorted(arr, (size_t)n, target) != NULL;
    end = clock();
    printf("%d,Binary search (pre-sorted array),%d,%.6f\n",
           n, reps, elapsed_ms(start, end) / reps);

    free(arr);
    free_records(head);
}

int main(void)
{
    int sizes[] = {20, 100, 500, 1000};
    puts("DatasetSize,Algorithm,Repetitions,AverageMilliseconds");
    for (size_t i = 0; i < sizeof sizes / sizeof sizes[0]; ++i)
        run_test(sizes[i]);
    return found_sink ? 0 : 1;
}

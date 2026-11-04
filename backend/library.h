#ifndef LIBRARY_H
#define LIBRARY_H
#include <stddef.h>
#define TITLE_LEN 160
#define AUTHOR_LEN 120
#define CATEGORY_LEN 64
#define FILE_LEN 128
#define TEXT_LEN 8192

typedef struct Document {
    int id;
    char title[TITLE_LEN];
    char author[AUTHOR_LEN];
    char category[CATEGORY_LEN];
    int year;
    char filename[FILE_LEN];
    struct Document *next;
} Document;

Document *load_documents(void);
void free_documents(Document *head);
int save_documents(const Document *head);
Document *find_document(Document *head, int id);
int add_document(Document **head, const Document *doc);
int update_document(Document *head, const Document *doc);
int delete_document(Document **head, int id);
int next_document_id(const Document *head);
int write_content(const char *filename, const char *content);
char *read_content(const char *filename);
#endif

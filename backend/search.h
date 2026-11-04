#ifndef SEARCH_H
#define SEARCH_H
#include "library.h"
void sort_documents(Document **head, const char *field, const char *direction);
int document_matches(const Document *doc, const char *query, const char *mode);
#endif

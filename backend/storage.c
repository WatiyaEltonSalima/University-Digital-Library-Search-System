#include "library.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifdef _WIN32
#define PATH_SEP "\\"
#else
#define PATH_SEP "/"
#endif
#define DB_FILE "data/library.tsv"
#define DOC_DIR "data/documents/"

Document *load_documents(void) {
    FILE *f=fopen(DB_FILE,"r"); if(!f) return NULL;
    Document *head=NULL, **tail=&head; char line[600];
    while(fgets(line,sizeof line,f)) {
        Document *d=(Document*)calloc(1,sizeof(Document)); if(!d) break;
        if(sscanf(line,"%d\t%159[^\t]\t%119[^\t]\t%63[^\t]\t%d\t%127[^\n]",&d->id,d->title,d->author,d->category,&d->year,d->filename)==6) {
            *tail=d; tail=&d->next;
        } else free(d);
    }
    fclose(f); return head;
}
int save_documents(const Document *head) {
    FILE *f=fopen(DB_FILE,"w"); if(!f) return 0;
    for(const Document *d=head;d;d=d->next)
        fprintf(f,"%d\t%s\t%s\t%s\t%d\t%s\n",d->id,d->title,d->author,d->category,d->year,d->filename);
    fclose(f); return 1;
}
void free_documents(Document *head){ while(head){Document *n=head->next;free(head);head=n;} }
Document *find_document(Document *head,int id){for(;head;head=head->next)if(head->id==id)return head;return NULL;}
int next_document_id(const Document *head){int m=0;for(;head;head=head->next)if(head->id>m)m=head->id;return m+1;}
int add_document(Document **head,const Document *doc){Document *n=(Document*)malloc(sizeof(Document));if(!n)return 0;*n=*doc;n->next=NULL;if(!*head)*head=n;else{Document *p=*head;while(p->next)p=p->next;p->next=n;}return save_documents(*head);}
int update_document(Document *head,const Document *doc){Document *p=find_document(head,doc->id);if(!p)return 0;Document *next=p->next;*p=*doc;p->next=next;return save_documents(head);}
int delete_document(Document **head,int id){Document **p=head;while(*p&&(*p)->id!=id)p=&(*p)->next;if(!*p)return 0;Document *old=*p;*p=old->next;char path[256];snprintf(path,sizeof path,"%s%s",DOC_DIR,old->filename);remove(path);free(old);return save_documents(*head);}
int write_content(const char *filename,const char *content){char path[256];snprintf(path,sizeof path,"%s%s",DOC_DIR,filename);FILE *f=fopen(path,"w");if(!f)return 0;fputs(content?content:"",f);fclose(f);return 1;}
char *read_content(const char *filename){char path[256];snprintf(path,sizeof path,"%s%s",DOC_DIR,filename);FILE *f=fopen(path,"r");if(!f)return NULL;char *buf=(char*)calloc(TEXT_LEN,1);if(!buf){fclose(f);return NULL;}size_t n=fread(buf,1,TEXT_LEN-1,f);buf[n]='\0';fclose(f);return buf;}

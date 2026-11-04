#include "library.h"
#include "search.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void json(const char *s){putchar('"');for(;s&&*s;s++){unsigned char c=(unsigned char)*s;if(c=='"'||c=='\\'){putchar('\\');putchar(c);}else if(c=='\n')printf("\\n");else if(c=='\r')printf("\\r");else if(c=='\t')printf("\\t");else if(c>=32)putchar(c);}putchar('"');}
static void print_doc(const Document *d){char *content=read_content(d->filename);printf("{\"id\":%d,\"title\":",d->id);json(d->title);printf(",\"author\":");json(d->author);printf(",\"category\":");json(d->category);printf(",\"year\":%d,\"filename\":",d->year);json(d->filename);printf(",\"content\": ");json(content?content:"");printf("}");free(content);}
static void usage(void){printf("{\"ok\":false,\"error\":\"Invalid command\"}");}
int main(int argc,char **argv){if(argc<2){usage();return 1;}Document *head=load_documents();const char *cmd=argv[1];
 if(!strcmp(cmd,"list")||!strcmp(cmd,"search")){const char *q=argc>2?argv[2]:"",*mode=argc>3?argv[3]:"AND",*field=argc>4?argv[4]:"title",*dir=argc>5?argv[5]:"asc";if(!strcmp(cmd,"list"))q="";sort_documents(&head,field,dir);printf("{\"ok\":true,\"documents\":[");int first=1;for(Document *d=head;d;d=d->next)if(document_matches(d,q,mode)){if(!first)putchar(',');print_doc(d);first=0;}printf("]}");}
 else if(!strcmp(cmd,"add")&&argc>=7){Document d={0};d.id=next_document_id(head);snprintf(d.title,sizeof d.title,"%s",argv[2]);snprintf(d.author,sizeof d.author,"%s",argv[3]);snprintf(d.category,sizeof d.category,"%s",argv[4]);d.year=atoi(argv[5]);snprintf(d.filename,sizeof d.filename,"doc_%d.txt",d.id);if(!write_content(d.filename,argv[6])||!add_document(&head,&d)){printf("{\"ok\":false,\"error\":\"Could not save document\"}");}else printf("{\"ok\":true,\"id\":%d}",d.id);}
 else if(!strcmp(cmd,"edit")&&argc>=8){Document d={0};d.id=atoi(argv[2]);snprintf(d.title,sizeof d.title,"%s",argv[3]);snprintf(d.author,sizeof d.author,"%s",argv[4]);snprintf(d.category,sizeof d.category,"%s",argv[5]);d.year=atoi(argv[6]);Document *old=find_document(head,d.id);if(old){snprintf(d.filename,sizeof d.filename,"%s",old->filename);if(write_content(d.filename,argv[7])&&update_document(head,&d))printf("{\"ok\":true}");else printf("{\"ok\":false,\"error\":\"Could not update document\"}");}else printf("{\"ok\":false,\"error\":\"Document not found\"}");}
 else if(!strcmp(cmd,"delete")&&argc>=3){int id=atoi(argv[2]);if(delete_document(&head,id))printf("{\"ok\":true}");else printf("{\"ok\":false,\"error\":\"Document not found\"}");}
 else if(!strcmp(cmd,"stats")){int total=0,cats[5]={0};const char *names[5]={"Books","Research Papers","Lecture Notes","Journals","Study Guides"};for(Document *d=head;d;d=d->next){total++;for(int i=0;i<5;i++)if(!strcmp(d->category,names[i]))cats[i]++;}printf("{\"ok\":true,\"total\":%d,\"categories\":[",total);for(int i=0;i<5;i++){if(i)putchar(',');printf("{\"name\":");json(names[i]);printf(",\"count\":%d}",cats[i]);}printf("]}");}
 else { usage(); }
 free_documents(head);
 return 0;
}

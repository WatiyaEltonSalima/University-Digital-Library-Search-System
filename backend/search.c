#define _POSIX_C_SOURCE 200809L
#include "search.h"
#include <ctype.h>
#include <stdlib.h>
#include <strings.h>
#include <stdio.h>
#include <string.h>

static int contains_ci(const char *hay,const char *needle){if(!needle||!*needle)return 1;size_t n=strlen(needle);for(;*hay;hay++){size_t i=0;while(i<n&&hay[i]&&tolower((unsigned char)hay[i])==tolower((unsigned char)needle[i]))i++;if(i==n)return 1;}return 0;}
static int term_match(const Document *d,const char *term){char *text=read_content(d->filename);int found=contains_ci(d->title,term)||contains_ci(d->author,term)||contains_ci(d->category,term)||(text&&contains_ci(text,term));free(text);return found;}
int document_matches(const Document *d,const char *query,const char *mode){if(!query||!*query)return 1;char copy[512];snprintf(copy,sizeof copy,"%s",query);int is_or=(mode&&strcmp(mode,"OR")==0),seen=0,matched=0;char *save=NULL;for(char *t=strtok_r(copy," \t\r\n",&save);t;t=strtok_r(NULL," \t\r\n",&save)){seen=1;int m=term_match(d,t);if(is_or&&m)return 1;if(!is_or&&!m)return 0;matched+=m;}return !seen||(!is_or&&matched>0)|| (is_or&&matched>0);}
static int cmp(const Document *a,const Document *b,const char *field){if(!strcmp(field,"year"))return (a->year>b->year)-(a->year<b->year);if(!strcmp(field,"author"))return strcasecmp(a->author,b->author);return strcasecmp(a->title,b->title);}
void sort_documents(Document **head,const char *field,const char *direction){if(!head||!*head)return;int desc=direction&&strcmp(direction,"desc")==0;Document *sorted=NULL;while(*head){Document *node=*head;*head=node->next;Document **p=&sorted;while(*p&&(desc?cmp(*p,node,field)>=0:cmp(*p,node,field)<=0))p=&(*p)->next;node->next=*p;*p=node;}*head=sorted;}

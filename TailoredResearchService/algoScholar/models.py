from django.db import models

class Document(models.Model):
    title = models.CharField(max_length=255)
    summary = models.TextField()
    pdf_url = models.URLField()

    def __str__(self):
        return self.title

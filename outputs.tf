output "cloudfront_url" {
  description = "URL del sitio servido por CloudFront"
  value       = "https://${aws_cloudfront_distribution.cdn.domain_name}"
}

output "bucket_name" {
  value = aws_s3_bucket.static_site.id
}

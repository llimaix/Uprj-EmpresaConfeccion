output "s3_website_url" {
  value = aws_s3_bucket.static_site.website_endpoint
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

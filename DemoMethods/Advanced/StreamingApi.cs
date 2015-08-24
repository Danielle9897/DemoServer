﻿using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using DemoMethods.Entities;
using DemoMethods.Indexes;
using Raven.Abstractions.Data;
using Raven.Client.Indexes;

namespace DemoMethods.Advanced
{
    public partial class AdvancedController : ApiController
    {
        public class ResultsType
        {
            public Product[] Page1;
            public Product[] Page5;
        }

        [HttpGet]
        public object StreamingApi()
        {
            using (var session = DocumentStoreHolder.Store.OpenSession())
            {
                var query = session.Query<Product>("Index/ManyProduct");

                var e = session
                    .Advanced                  
                    .Stream(query);

                const int pageSize = 3;
                
                ResultsType results = new ResultsType();
                results.Page1 = new Product[pageSize];
                results.Page5 = new Product[pageSize];

                // TODO: Send as CSV 
                for (var page = 1; page <= 10; page++)
                {
                    for (var itemInPage = 0; itemInPage < pageSize; itemInPage++)
                    {
                        e.MoveNext();
                        var product = e.Current;

                        if (page == 1)
                            results.Page1[itemInPage] = product.Document;
                        if (page == 5)
                            results.Page5[itemInPage] = product.Document;
                    }
                }

                return (results);
            }
        }        
    }
}
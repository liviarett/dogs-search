// Will show related results based upon the current result

import {
  Component,
  ComponentOptions,
  IBuildingQueryEventArgs,
  IResultsComponentBindings,
  IInitializationEventArgs,
  InitializationEvents,
  Initialization,
  StringUtils,
  IQueryResult,
  IGroupByRequest,
  QueryEvents,
  AnalyticsEvents,
  IChangeAnalyticsCustomDataEventArgs,
  ResultLink,
  $$,
  Dom,
  AnyKeywordsInput

} from 'coveo-search-ui';


export interface IResultsRelatedOptions {
  resultTemplate?:any;
  name?:any;
  label?:any;
  pipeline?:any;
  dq?:any;
  normalCaption?:any;
  titleCaption?:any;
  expandedComment?:any;
  expandedQuery?:any;
  expandedCaption?:any;
  noResultsCaption?:any;
  query?:any; // The Advanced query to execute, fields are noted as [FIELD1][FIELD2] from the fields section
  filterField?:any;
  numberOfResults?:any;
  partialMatch?:any;
  partialMatchKeywords?:any;
  partialMatchThreshold?:any;
  alwaysShow?:any;
  indent?:any;
  groupByFields?:any;
  callback?:any;
}

export class ResultsRelated extends Coveo.Component {
  static ID = 'ResultsRelated';

  static options: IResultsRelatedOptions = {
    resultTemplate: Coveo.ComponentOptions.buildTemplateOption({
      defaultFunction: function() {
        return new Coveo.DefaultResultTemplate();
      }
    }),
    name: Coveo.ComponentOptions.buildLocalizedStringOption(),
    label: Coveo.ComponentOptions.buildLocalizedStringOption(),
    pipeline: Coveo.ComponentOptions.buildLocalizedStringOption(),
    dq: Coveo.ComponentOptions.buildLocalizedStringOption(),
    normalCaption: Coveo.ComponentOptions.buildLocalizedStringOption(),
    titleCaption: Coveo.ComponentOptions.buildLocalizedStringOption(),
    expandedComment: Coveo.ComponentOptions.buildLocalizedStringOption(),
    expandedQuery: Coveo.ComponentOptions.buildStringOption({ defaultValue: '' }),
    expandedCaption: Coveo.ComponentOptions.buildLocalizedStringOption(),
    noResultsCaption: Coveo.ComponentOptions.buildLocalizedStringOption(),
    query: Coveo.ComponentOptions.buildStringOption(), // The Advanced query to execute, fields are noted as [FIELD1][FIELD2] from the fields section
    filterField: Coveo.ComponentOptions.buildStringOption(),
    numberOfResults: Coveo.ComponentOptions.buildNumberOption(),
    partialMatch: Coveo.ComponentOptions.buildBooleanOption({ defaultValue: false }),
    partialMatchKeywords: Coveo.ComponentOptions.buildStringOption( { defaultValue: '4'}),
    partialMatchThreshold: Coveo.ComponentOptions.buildStringOption( { defaultValue: '50%'}),
    alwaysShow: Coveo.ComponentOptions.buildBooleanOption({ defaultValue: false }),
    callback: Coveo.ComponentOptions.buildBooleanOption({ defaultValue: false }),
    groupByFields: Coveo.ComponentOptions.buildStringOption( { defaultValue: ''}),
    indent: Coveo.ComponentOptions.buildNumberOption()
  };

  private showingMoreResults: boolean;
  private noResultsCaption: HTMLElement;
  private header: HTMLElement;
  private results: HTMLElement;

  constructor(public element: HTMLElement, public options: IResultsRelatedOptions, public bindings: IResultsComponentBindings, public result?: IQueryResult) {
    super(element, ResultsRelated.ID, bindings);
    this.options = ComponentOptions.initComponentOptions(element, ResultsRelated, options);
    this.element = element;
    this.showingMoreResults = false;
    this.options = options;
    this.bindings = bindings;
    this.result = result;
    if (!options.callback){
      this.buildElements();
      this.updateElementVisibility(0);
    }
    if (options.alwaysShow || options.callback) {
      this.showMoreResults();
    }
  }

  private buildElements() {
    let _this = this;
    _this.buildHeader();
    _this.buildResults();
  }



  private preventEventPropagation() {
   this.preventEventPropagationOn(Coveo.QueryEvents);
   this.preventEventPropagationOn(Coveo.OmniboxEvents);
   this.preventEventPropagationOn(Coveo.ResultListEvents);
   this.preventEventPropagationOn(Coveo.SettingsEvents);
   this.preventEventPropagationOn(Coveo.PreferencesPanelEvents);
   this.preventEventPropagationOn(Coveo.AnalyticsEvents);
   this.preventEventPropagationOn(Coveo.BreadcrumbEvents);
   this.preventEventPropagationOn(Coveo.QuickviewEvents);
   this.preventEventPropagationOn(Coveo.InitializationEvents);
}

private preventEventPropagationOn(eventType) {
  let eventName = function (event) {
    return event;
  };
   for (var event_1 in eventType) {
       Coveo.$$(this.root).on(eventName(event_1), function (e) { return e.stopPropagation(); });
   }
}

private escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

private replaceAll(str, find, replace) {
  return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
}



private async showMoreResults() {
    let _this = this;
    this.updateElementVisibility(0);
    this.preventEventPropagation();
    this.showingMoreResults = true;

      let queryBuilder = new Coveo.QueryBuilder();
      //Copy settings from last Query Builder
      let binding = _this.bindings;
      queryBuilder.locale = binding.queryController.getLastQuery().locale;
      queryBuilder.pipeline = this.options.pipeline;//'default';//binding.queryController.lastQueryBuilder.pipeline;
      queryBuilder.searchHub = binding.queryController.getLastQuery().searchHub;
      queryBuilder.enableQuerySyntax = true;
      queryBuilder.enableDuplicateFiltering = true;
      queryBuilder.excerptLength = binding.queryController.getLastQuery().excerptLength;
      queryBuilder.addContext(binding.queryController.getLastQuery().context);
      queryBuilder.timezone = binding.queryController.getLastQuery().timezone;
      queryBuilder.numberOfResults = this.options.numberOfResults;
      if (_this.options.groupByFields!=''){
        var group = _this.options.groupByFields.split(',');
        for (var f = 0; f < group.length; f++) {
          queryBuilder.groupByRequests.push({ field:'@'+group[f] , injectionDepth: 1000, sortCriteria: 'occurrences' });
        }
      }
      let newquery = this.options.query;
      console.log('newquery:', newquery)
      let dq = this.options.dq;

      //Fix title and author
      if (this.result!=undefined) {
        this.result.raw['title'] = this.result.title;
          queryBuilder.advancedExpression.add(' NOT @urihash="'+this.result.raw['urihash']+'"')

        let i = 0;
        //let allfieldsmissing = true;
        newquery =  StringUtils.buildStringTemplateFromResult(newquery, this.result);
        if (this.options.dq){
          dq= StringUtils.buildStringTemplateFromResult(dq, this.result);
        }
        newquery = this.replaceAll(newquery, 'i:0#.f|membership|','');
      }
      /*
      if (allfieldsmissing) {
        // fieldcontent is invalid or missing, the query will return everything.
        // So we show "No related" instead.
        this.updateElementVisibility(0);
        return false;
      }*/

      if (this.options.filterField) {
        queryBuilder.filterField = this.options.filterField;
      }
      if (this.result!=undefined){
        if (this.result.state) {
          newquery = newquery.replace('[QUERY]', this.result.state['q']);
        }
      }
      if (this.options.dq){
       queryBuilder.disjunctionExpression.add(dq);
      }

      queryBuilder.expression.add(newquery);

      if (this.options.partialMatch) {
        queryBuilder.enablePartialMatch = true;
        queryBuilder.partialMatchKeywords = this.options.partialMatchKeywords;
        queryBuilder.partialMatchThreshold = this.options.partialMatchThreshold;
      }
      this.bindings
        .queryController.getEndpoint()
        .search(queryBuilder.build())
        .then(function(data) {
          if (_this.options.callback) {
            //_this.sentReady(data);
          } else {
          _this.showingMoreResults = true;
          _this.updateElementVisibility(data.results.length);
          _this.displayThoseResults(data.results);
          }
          //return !data.results.length === 0;
        });

  }


  private buildHeader() {
    this.header = $$('div',{ className: 'coveo-folding-header' }).el;
    this.element.appendChild(this.header);
  }

  private buildResults() {
    this.results = $$('div',{ className: 'coveo-folding-results2' }).el;
    this.header.appendChild(this.results);
    this.noResultsCaption = $$('div',{ className: 'coveo-folding-header-caption' }).el;
    this.noResultsCaption.setAttribute('aria-label',this.options.noResultsCaption);
    this.results.appendChild(this.noResultsCaption);
  }

  private updateElementVisibility(subResultsLength) {
    //$$(this.noResultsCaption).addClass('coveo-hidden');
    if (!this.options.callback) {
      if (subResultsLength === 0) {
        $$(this.noResultsCaption).removeClass('coveo-hidden');
      }
    }
  }

  private displayThoseResults(results) {
    let _this = this;
    this.results.innerHTML='';
    if (results.length === 0) {
      this.noResultsCaption = $$('div',{ className: 'coveo-folding-header-caption' }).el;
      this.noResultsCaption.innerHTML = this.options.noResultsCaption;
      this.results.appendChild(this.noResultsCaption);
    } else {
      this.noResultsCaption = $$('div',{ className: 'coveo-folding-header-caption' }).el;
      this.noResultsCaption.innerHTML = this.options.normalCaption;
      this.results.appendChild(this.noResultsCaption);
    }
   /* debugger;
    const container = document.querySelector(`.coveo-folding-results2`);
container.innerHTML = 'Wim';
    const ResultList = Coveo.get(document.querySelector('.CoveoResultList'));// as Coveo.ResultList;
ResultList.buildResults(results).then(async (elements) => {
 for (let element of elements) {
   container.append(element);
 }
});*/
//debugger;
    results.map( result => {
      result.raw.collection = result.raw.collection || 'default';
      _this.renderChildResult(result);
    });
  }

  private renderChildResult(childResult) {
    let binding = this.bindings;
    Coveo.QueryUtils.setStateObjectOnQueryResult(binding.queryStateModel.get(), childResult);
    Coveo.QueryUtils.setSearchInterfaceObjectOnQueryResult(binding.searchInterface, childResult);

    let addToContainer = (container, childResult) => {
      if (container) {
        this.autoCreateComponentsInsideResult(container, childResult);
        $$(container).addClass('coveo-result-attachments-container CoveoResult');
        this.results.appendChild(container);
      }
    };

    let containerOrPromise = this.options.resultTemplate.instantiateToElement(childResult,{
     wrapInDiv: true,
     checkCondition: true,
     currentLayout: 'list',
     responsiveComponents: binding.searchInterface.responsiveComponents}); // Promise on JSUI2 ?
    if (containerOrPromise && containerOrPromise.then) {
      containerOrPromise.then(container => {
        addToContainer(container, childResult);
      });
    } else {
      addToContainer(containerOrPromise, childResult);
    }
  }

  private autoCreateComponentsInsideResult(element, result) {
    //return Coveo.Initialization.automaticallyCreateComponentsInsideResult(element, result);
    Coveo.Assert.exists(element);
    let initOptions = this.bindings.searchInterface.options;
    initOptions = _.extend({}, initOptions, { closeModalBox: false });
    let initParameters = { options: initOptions, bindings: this.bindings, result: result };
    //Coveo.CoveoJQuery.automaticallyCreateComponentsInside(element, initParameters, [MyResultsRelated.ID]);
    Coveo.Initialization.automaticallyCreateComponentsInside(element, initParameters, [ResultsRelated.ID]);
  }
}


Initialization.registerAutoCreateComponent(ResultsRelated);